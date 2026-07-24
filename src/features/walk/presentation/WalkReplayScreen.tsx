"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  getWalk,
  listApplications,
  type ApplicationWithInsights,
} from "@/features/walk/infrastructure/walk-repository";
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
      };
    });
  }, [visible]);

  const openZoneApps = useMemo(
    () => (openZone ? visible.filter((a) => a.bodyZone === openZone) : []),
    [openZone, visible],
  );

  if (!walk || applications === null || cursor === null) {
    return (
      <div className="flex flex-col gap-5" aria-busy>
        <div className="shimmer-bar h-10 w-2/3 border-2 border-on-background/10" />
        <div
          className="shimmer-bar w-full max-w-[380px] mx-auto border-2 border-on-background/10"
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
          <h1 className="hero-line-1 font-sans font-black text-2xl tracking-tighter uppercase leading-none mt-1.5">
            {walk.title || "Balade"}
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 mt-1.5">
            {timeOf(walk.startedAt)}
            {walk.endedAt ? ` — ${timeOf(walk.endedAt)}` : " — en cours"} ·{" "}
            {total} pose{total > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/journal"
          aria-label="Retour au journal"
          className="shrink-0 w-9 h-9 border-2 border-on-background flex items-center justify-center active:scale-95 transition-transform"
        >
          <Icon name="arrow_back" size={17} />
        </Link>
      </header>

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
            className="bubble-in absolute top-2 right-2 px-3 py-1.5 bg-background/95 backdrop-blur border border-outline-variant text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 active:scale-95 transition-transform z-10"
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
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
              Rejouer la session
            </span>
            <span
              key={cursor}
              className="caption-rise font-mono text-[10px] font-bold uppercase tracking-widest"
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
                  className="absolute left-[5px] top-4 bottom-0 w-[2px] bg-on-background/20"
                />
              )}
              <span
                aria-hidden
                className={clsx(
                  "absolute left-0 top-1.5 w-3 h-3 border-2 border-on-background transition-colors duration-300",
                  shown ? "bg-on-background" : "bg-background",
                )}
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
                    focused?.id === app.id && "bg-on-background/5",
                  )}
                >
                  <PhotoThumb
                    path={app.photoPath}
                    alt={app.perfumeName}
                    className="w-12 h-12 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[9px] uppercase tracking-widest opacity-50">
                      {timeOf(app.appliedAt)} · {BODY_ZONE_LABELS[app.bodyZone]}
                    </p>
                    <p className="font-sans font-bold text-sm tracking-tight truncate mt-0.5 flex items-center gap-1.5">
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
                      <p className="text-xs opacity-60 truncate">{app.note}</p>
                    )}
                    {app.impressions.length > 0 && (
                      <p className="font-mono text-[9px] uppercase tracking-widest opacity-40 mt-0.5">
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
                  className="shrink-0 w-8 h-8 border-2 border-on-background/40 hover:border-on-background flex items-center justify-center active:scale-95 transition-all"
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
        readOnly
        onClose={() => setOpenZone(null)}
      />
    </div>
  );
}
