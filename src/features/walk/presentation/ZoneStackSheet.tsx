"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { Icon } from "@/shared/ui/Icon";
import { PhotoThumb } from "@/shared/ui/PhotoThumb";
import { SmartNoteField } from "@/shared/ui/SmartNoteField";
import { DRYDOWN_CHIPS } from "@/shared/lib/olfactory-lexicon";
import { colorFor } from "@/features/mannequin/domain/palette";
import {
  BODY_ZONE_LABELS,
  type BodyZone,
} from "@/features/mannequin/domain/body-zones";
import type {
  ApplicationWithInsights,
  Verdict,
} from "@/features/walk/infrastructure/walk-repository";

const VERDICT_CYCLE: (Verdict | null)[] = [null, "loved", "maybe", "no"];

const VERDICT_META: Record<Verdict, { icon: string; label: string }> = {
  loved: { icon: "favorite", label: "Banger" },
  maybe: { icon: "contrast", label: "À revoir" },
  no: { icon: "close", label: "Pas pour moi" },
};

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "T+12 min" depuis la pose — le langage du drydown. */
function sinceApplied(appliedAt: string, at: string): string {
  const mins = Math.round(
    (new Date(at).getTime() - new Date(appliedAt).getTime()) / 60000,
  );
  if (mins < 1) return "T+0";
  if (mins < 60) return `T+${mins} min`;
  return `T+${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, "0")}`;
}

type Props = {
  zone: BodyZone | null;
  applications: ApplicationWithInsights[];
  /** Couleurs de session (palette olfactive) — liserés des cartes. */
  sessionColors?: Map<string, string>;
  readOnly?: boolean;
  onClose: () => void;
  onSetVerdict?: (id: string, verdict: Verdict | null) => void;
  onAddImpression?: (app: ApplicationWithInsights, text: string) => Promise<void>;
  onDeleteApplication?: (app: ApplicationWithInsights) => Promise<void>;
};

/**
 * Le layering d'une zone : pile physique de cartes (la plus récente
 * dessus). On feuillette au tap, chaque carte glisse avec ressort.
 * Verdict 3 états au tap, impressions horodatées du drydown.
 */
export function ZoneStackSheet({
  zone,
  applications,
  sessionColors,
  readOnly = false,
  onClose,
  onSetVerdict,
  onAddImpression,
  onDeleteApplication,
}: Props) {
  // Pile : la plus récente d'abord.
  const stack = [...applications].reverse();
  const [index, setIndex] = useState(0);
  const [impression, setImpression] = useState("");
  const [busy, setBusy] = useState(false);
  const [prevZone, setPrevZone] = useState(zone);

  // Changer de zone remet la pile sur la carte du dessus (render-time).
  if (prevZone !== zone) {
    setPrevZone(zone);
    setIndex(0);
  }

  if (!zone || stack.length === 0) return null;

  const current = stack[Math.min(index, stack.length - 1)];

  function cycleVerdict() {
    if (readOnly || !onSetVerdict) return;
    const pos = VERDICT_CYCLE.indexOf(current.verdict);
    const next = VERDICT_CYCLE[(pos + 1) % VERDICT_CYCLE.length];
    onSetVerdict(current.id, next);
  }

  async function submitImpression() {
    const text = impression.trim();
    if (!text || busy || !onAddImpression) return;
    setBusy(true);
    try {
      await onAddImpression(current, text);
      setImpression("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      label={
        stack.length > 1
          ? `Layering — ${stack.length} couches`
          : "Une pose"
      }
      title={BODY_ZONE_LABELS[zone]}
    >
      {/* ─── La pile ─── */}
      <div
        className="relative mx-auto w-full max-w-[320px]"
        style={{ height: 148 + Math.min(stack.length - 1, 3) * 10 }}
      >
        {stack.map((app, i) => {
          const offset = i - index;
          const behind = offset > 0 ? Math.min(offset, 3) : 0;
          const accent = sessionColors
            ? colorFor(sessionColors, app.perfumeName)
            : null;
          return (
            <button
              key={app.id}
              type="button"
              onClick={() =>
                offset !== 0 && setIndex(stack.indexOf(app))
              }
              aria-label={`${app.perfumeName}, pose ${stack.length - i}/${stack.length}`}
              className={clsx(
                "stack-card absolute inset-x-0 top-0 text-left rounded-[22px] bg-surface-container-high p-4 flex gap-4",
                offset === 0 ? "z-30" : "z-20",
              )}
              style={{
                transform:
                  offset === 0
                    ? "translateY(0) scale(1) rotate(0deg)"
                    : offset < 0
                      ? `translateY(-24px) scale(0.92) rotate(-2deg)`
                      : `translateY(${behind * 10}px) scale(${1 - behind * 0.035}) rotate(${behind % 2 === 0 ? 1.2 : -1.2}deg)`,
                opacity: offset < 0 ? 0 : 1 - behind * 0.12,
                pointerEvents: offset < 0 ? "none" : "auto",
                zIndex: 30 - Math.abs(offset),
                ...(accent ? { borderLeft: `5px solid ${accent}` } : {}),
              }}
            >
              <PhotoThumb
                path={app.photoPath}
                alt={app.perfumeName}
                className="w-[104px] h-[104px] shrink-0"
              />
              <div className="min-w-0 flex-1 flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {timeOf(app.appliedAt)} · Pose {stack.length - i}/{stack.length}
                </span>
                <span className="text-base font-extrabold tracking-tight truncate mt-0.5">
                  {app.perfumeName}
                </span>
                {app.perfumeHouse && (
                  <span className="text-xs font-medium text-on-surface-variant truncate">
                    {app.perfumeHouse}
                  </span>
                )}
                {app.note && (
                  <span className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                    {app.note}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Feuilletage */}
      {stack.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            type="button"
            aria-label="Pose précédente"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high active:scale-95 transition-transform disabled:opacity-30"
          >
            <Icon name="arrow_upward" size={16} />
          </button>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
            {index + 1} / {stack.length}
          </span>
          <button
            type="button"
            aria-label="Pose suivante"
            onClick={() => setIndex((i) => Math.min(stack.length - 1, i + 1))}
            disabled={index === stack.length - 1}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high active:scale-95 transition-transform disabled:opacity-30"
          >
            <Icon name="arrow_downward" size={16} />
          </button>
        </div>
      )}

      {/* ─── Verdict ─── */}
      <div className="mt-6 flex items-center justify-between border-t border-surface-container-highest pt-4">
        <span className="inline-flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">
          Verdict
          {!readOnly && onDeleteApplication && (
            <button
              type="button"
              aria-label="Supprimer cette pose"
              onClick={async () => {
                const target = current;
                setIndex(0);
                await onDeleteApplication(target);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-high active:scale-95 transition-transform"
            >
              <Icon name="delete" size={13} />
            </button>
          )}
        </span>
        <button
          type="button"
          onClick={cycleVerdict}
          disabled={readOnly}
          className={clsx(
            "rounded-full px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider inline-flex items-center gap-2 transition-all duration-150 active:scale-95",
            current.verdict
              ? "bg-pop text-on-pop"
              : "bg-surface-container-high text-on-surface-variant",
          )}
        >
          {current.verdict ? (
            <>
              <Icon
                name={VERDICT_META[current.verdict].icon}
                size={13}
                filled
                className="select-pop"
              />
              {VERDICT_META[current.verdict].label}
            </>
          ) : (
            "À juger"
          )}
        </button>
      </div>

      {/* ─── Drydown : impressions horodatées ─── */}
      <div className="mt-5">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">
          Évolution — {current.impressions.length} impression
          {current.impressions.length > 1 ? "s" : ""}
        </span>

        {current.impressions.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2.5">
            {current.impressions.map((imp, i) => (
              <li key={i} className="bubble-in flex items-baseline gap-3 pl-3 relative">
                <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full bg-pop/50" />
                <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-lime">
                  {sinceApplied(current.appliedAt, imp.at)}
                </span>
                <span className="text-sm">{imp.text}</span>
              </li>
            ))}
          </ul>
        )}

        {!readOnly && onAddImpression && (
          <div className="mt-3 flex flex-col gap-2">
            <SmartNoteField
              value={impression}
              onChange={setImpression}
              chips={DRYDOWN_CHIPS}
              placeholder="Comment il évolue là, maintenant ?"
              onSubmit={submitImpression}
            />
            <button
              type="button"
              onClick={submitImpression}
              disabled={busy || !impression.trim()}
              className="inline-flex items-center gap-2 self-end rounded-full bg-lime px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-on-lime active:scale-95 transition-transform disabled:opacity-40"
            >
              <Icon name="add" size={15} />
              Horodater
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
