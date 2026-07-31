"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { SectionLabel } from "@/shared/ui/brutalist/SectionLabel";
import { Icon } from "@/shared/ui/Icon";
import { PhotoThumb } from "@/shared/ui/PhotoThumb";
import {
  LazyBodySilhouette3D,
  type PlacedMarker,
} from "@/features/mannequin/presentation/LazyBodySilhouette3D";
import {
  BODY_ZONE_LABELS,
  type BodyZone,
} from "@/features/mannequin/domain/body-zones";
import type { Walk } from "@/features/walk/domain/walk";
import {
  deleteWalk,
  getWalk,
  listApplications,
  type ApplicationWithInsights,
} from "@/features/walk/infrastructure/walk-repository";
import { toast } from "@/shared/ui/Toaster";
import {
  assignSessionColors,
  colorFor,
} from "@/features/mannequin/domain/palette";
import { ZoneStackSheet } from "./ZoneStackSheet";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const VERDICT_ICON: Record<string, string> = {
  loved: "favorite",
  maybe: "contrast",
  no: "close",
};

/**
 * Replay d'une balade — l'exigence du brief incarnée : le mannequin, les
 * photos, les zones, l'ordre, les notes, les heures. Le SCRUB temporel
 * rejoue la session : on glisse, les poses réapparaissent sur le corps
 * dans l'ordre chronologique réel.
 */
export function WalkReplayScreen({ walkId }: { walkId: string }) {
  const [walk, setWalk] = useState<Walk | null>(null);
  const [applications, setApplications] = useState<
    ApplicationWithInsights[] | null
  >(null);
  /** Curseur : nombre de poses visibles (0..N). N par défaut = tout. */
  const [cursor, setCursor] = useState<number | null>(null);
  const [openZone, setOpenZone] = useState<BodyZone | null>(null);
  /** Pose sélectionnée dans la timeline → la caméra dolly dessus. */
  const [focused, setFocused] = useState<ApplicationWithInsights | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    Promise.all([getWalk(walkId), listApplications(walkId)]).then(
      ([w, apps]) => {
        setWalk(w);
        setApplications(apps);
        setCursor(apps.length);
      },
    );
  }, [walkId]);

  const visible = useMemo(
    () => (applications ?? []).slice(0, cursor ?? 0),
    [applications, cursor],
  );

  /** Couleurs stables sur TOUTE la balade (pas seulement le visible). */
  const sessionColors = useMemo(
    () => assignSessionColors((applications ?? []).map((a) => a.perfumeName)),
    [applications],
  );

  const markers = useMemo<PlacedMarker[]>(() => {
    const byZone = new Map<BodyZone, ApplicationWithInsights[]>();
    for (const app of visible) {
      const list = byZone.get(app.bodyZone) ?? [];
      list.push(app);
      byZone.set(app.bodyZone, list);
    }
    return Array.from(byZone.entries()).map(([zone, apps]) => {
      const last = apps[apps.length - 1]!;
      return {
        fragranceId: last.id,
        zone,
        label:
          apps.length > 1 ? `×${apps.length}` : initials(last.perfumeName),
        position: last.position ?? undefined,
        color: colorFor(sessionColors, last.perfumeName),
        stack: apps.map((a) => colorFor(sessionColors, a.perfumeName)),
      };
    });
  }, [visible, sessionColors]);

  const openZoneApps = useMemo(
    () => (openZone ? visible.filter((a) => a.bodyZone === openZone) : []),
    [openZone, visible],
  );

  if (!walk || applications === null || cursor === null) {
    return (
      <div className="flex flex-col gap-5" aria-busy>
        <div className="shimmer-bar h-10 w-2/3 rounded-full" />
        <div
          className="shimmer-bar mx-auto w-full max-w-[380px] rounded-[26px]"
          style={{ aspectRatio: "3 / 4" }}
        />
      </div>
    );
  }

  const total = applications.length;
  const lastVisible = visible[visible.length - 1] ?? null;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel animated>
            {new Date(walk.startedAt).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </SectionLabel>
          <h1 className="hero-line-1 title-mega text-3xl mt-1.5">
            {walk.title || "Balade"}
          </h1>
          <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            {timeOf(walk.startedAt)}
            {walk.endedAt ? ` — ${timeOf(walk.endedAt)}` : " — en cours"} ·{" "}
            {total} pose{total > 1 ? "s" : ""}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            aria-label="Supprimer la balade"
            onClick={() => setConfirmDelete(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low active:scale-95 transition-transform"
          >
            <Icon name="delete" size={16} />
          </button>
          <Link
            href="/journal"
            aria-label="Retour au journal"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high active:scale-95 transition-transform"
          >
            <Icon name="arrow_back" size={17} />
          </Link>
        </div>
      </header>

      {/* Confirmation de suppression — action destructive, jamais en un tap. */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-8">
          <button
            type="button"
            aria-label="Annuler"
            onClick={() => setConfirmDelete(false)}
            className="backdrop-fade-in absolute inset-0 bg-on-background/50 cursor-default"
          />
          <div className="bubble-in relative flex w-full max-w-xs flex-col gap-4 rounded-[26px] bg-surface-container-low p-6">
            <p className="title-mega text-2xl">
              Supprimer cette balade ?
            </p>
            <p className="text-sm font-medium text-on-surface-variant">
              Les {total} pose{total > 1 ? "s" : ""}, photos et impressions
              seront définitivement effacées.
            </p>
            <div className="flex gap-2.5 mt-1">
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await deleteWalk(walk.id);
                    toast("Balade supprimée", "success");
                    router.replace("/journal");
                  } catch (e) {
                    toast(
                      e instanceof Error ? e.message : "Échec de la suppression",
                      "error",
                    );
                    setDeleting(false);
                  }
                }}
                className="flex-1 rounded-full bg-pop px-4 py-3 text-[12px] font-extrabold uppercase tracking-wider text-on-pop active:scale-95 transition-transform disabled:opacity-50"
              >
                {deleting ? "…" : "Supprimer"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-full bg-surface-container-high px-4 py-3 text-[12px] font-extrabold uppercase tracking-wider active:scale-95 transition-transform"
              >
                Garder
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <LazyBodySilhouette3D
          readOnly
          filledMarkers={markers}
          poseCount={visible.length}
          highlightedZone={focused?.bodyZone ?? null}
          focusPoint={focused?.position ?? null}
        />
        {focused && (
          <button
            type="button"
            onClick={() => setFocused(null)}
            className="bubble-in absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider text-white backdrop-blur active:scale-95 transition-transform"
          >
            <Icon name="zoom_out" size={12} />
            Vue d&apos;ensemble
          </button>
        )}
      </div>

      {/* ─── Scrub temporel ─── */}
      {total > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
              Rejouer la session
            </span>
            <span
              key={cursor}
              className="caption-rise text-[11px] font-extrabold uppercase tracking-wider text-lime"
            >
              {cursor === 0
                ? "Début"
                : `${timeOf(lastVisible!.appliedAt)} · ${lastVisible!.perfumeName}`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={total}
            step={1}
            value={cursor}
            onChange={(e) => {
              setCursor(Number(e.target.value));
              setFocused(null);
            }}
            className="scrub-range"
            aria-label="Position dans la balade"
          />
        </div>
      )}

      {/* ─── Timeline ─── */}
      <ol className="flex flex-col">
        {applications.map((app, i) => {
          const shown = i < cursor;
          return (
            <li key={app.id} className="relative pl-6 pb-5 last:pb-0">
              {/* Filet vertical de la timeline */}
              {i < applications.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[5px] top-4 bottom-0 w-[2px] bg-surface-container-highest"
                />
              )}
              <span
                aria-hidden
                className="absolute left-0 top-1.5 h-3 w-3 rounded-full transition-colors duration-300"
                style={{
                  backgroundColor: shown
                    ? colorFor(sessionColors, app.perfumeName)
                    : "transparent",
                }}
              />
              <div
                className={clsx(
                  "flex items-center gap-2 transition-opacity duration-300",
                  shown ? "opacity-100" : "opacity-35",
                )}
              >
                {/* Tap principal : la caméra dolly sur l'endroit exact du
                    corps où ce parfum a été posé. */}
                <button
                  type="button"
                  onClick={() => {
                    setCursor(Math.max(cursor, i + 1));
                    setFocused(app);
                  }}
                  className={clsx(
                    "flex-1 min-w-0 text-left flex items-center gap-3.5 -mx-2 px-2 py-1 transition-colors",
                    focused?.id === app.id && "rounded-2xl bg-surface-container-low",
                  )}
                >
                  <PhotoThumb
                    path={app.photoPath}
                    alt={app.perfumeName}
                    className="w-12 h-12 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {timeOf(app.appliedAt)} · {BODY_ZONE_LABELS[app.bodyZone]}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm font-extrabold tracking-tight">
                      {app.perfumeName}
                      {app.verdict && (
                        <Icon
                          name={VERDICT_ICON[app.verdict]}
                          size={13}
                          filled
                          className="opacity-70"
                        />
                      )}
                    </p>
                    {app.note && (
                      <p className="truncate text-xs text-on-surface-variant">{app.note}</p>
                    )}
                    {app.impressions.length > 0 && (
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                        {app.impressions.length} impression
                        {app.impressions.length > 1 ? "s" : ""} drydown
                      </p>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  aria-label={`Détail de la zone ${BODY_ZONE_LABELS[app.bodyZone]}`}
                  onClick={() => {
                    setCursor(Math.max(cursor, i + 1));
                    setOpenZone(app.bodyZone);
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-low active:scale-95 transition-transform"
                >
                  <Icon name="layers" size={15} />
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <ZoneStackSheet
        zone={openZone}
        applications={openZoneApps}
        sessionColors={sessionColors}
        readOnly
        onClose={() => setOpenZone(null)}
      />
    </div>
  );
}
