"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import {
  LazyBodySilhouette3D,
  type PlacedMarker,
} from "@/features/mannequin/presentation/LazyBodySilhouette3D";
import {
  BODY_ZONE_LABELS,
  type BodyZone,
} from "@/features/mannequin/domain/body-zones";
import type { Walk } from "@/features/walk/domain/walk";
import type { WishlistItem } from "@/features/wishlist/domain/wishlist-item";
import {
  addApplication,
  addImpression,
  deleteApplication,
  endWalk,
  setVerdict,
  type ApplicationWithInsights,
  type Verdict,
} from "@/features/walk/infrastructure/walk-repository";
import { toast } from "@/shared/ui/Toaster";
import { Icon } from "@/shared/ui/Icon";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { haptic } from "@/shared/lib/haptics";
import {
  assignSessionColors,
  colorFor,
} from "@/features/mannequin/domain/palette";
import { MannequinSettingsPanel } from "@/features/mannequin/presentation/MannequinSettingsPanel";
import { WalkChrono } from "./WalkChrono";
import { SessionLegend, type LegendEntry } from "./SessionLegend";
import {
  PlacementSheet,
  type PlacementDraft,
  type PlacementResult,
} from "./PlacementSheet";
import { ZoneStackSheet } from "./ZoneStackSheet";
import { EndWalkOverlay } from "./EndWalkOverlay";

/** Initiales du parfum pour le label du marqueur (max 2 lettres). */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function formatDuration(startedAt: string): string {
  const mins = Math.max(
    1,
    Math.round((Date.now() - new Date(startedAt).getTime()) / 60000),
  );
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, "0")}`;
}

type Props = {
  walk: Walk;
  initialApplications: ApplicationWithInsights[];
  wishlist: WishlistItem[];
  /** Appelé quand la balade est terminée et l'overlay fermé. */
  onEnded: () => void;
};

/**
 * Balade active — l'écran central de La Niche.
 * Chrono odomètre, rail wishlist (tap = pré-sélection), mannequin en
 * mode placement, sheet de pose caméra-first, vol de la photo vers le
 * marqueur (FLIP), layering par zone en pile de cartes.
 */
export function ActiveWalk({
  walk,
  initialApplications,
  wishlist,
  onEnded,
}: Props) {
  const [applications, setApplications] =
    useState<ApplicationWithInsights[]>(initialApplications);
  const [draft, setDraft] = useState<PlacementDraft | null>(null);
  const [preselected, setPreselected] = useState<WishlistItem | null>(null);
  const [openZone, setOpenZone] = useState<BodyZone | null>(null);
  const [highlighted, setHighlighted] = useState<BodyZone | null>(null);
  const [ended, setEnded] = useState(false);
  const [endBusy, setEndBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** Focus caméra contrôlé (tap corps OU tap légende). */
  const [focus, setFocus] = useState<[number, number, number] | null>(null);
  /** Parfum mis en avant depuis la légende. */
  const [legendActive, setLegendActive] = useState<string | null>(null);
  const mannequinRef = useRef<HTMLDivElement>(null);

  /** Couleurs de session : 1 parfum = 1 teinte, ordre d'apparition. */
  const sessionColors = useMemo(
    () => assignSessionColors(applications.map((a) => a.perfumeName)),
    [applications],
  );

  // ─── Marqueurs : un par zone, couleur du parfum, anneaux si layering ──
  const markers = useMemo<PlacedMarker[]>(() => {
    const byZone = new Map<BodyZone, ApplicationWithInsights[]>();
    for (const app of applications) {
      const list = byZone.get(app.bodyZone) ?? [];
      list.push(app);
      byZone.set(app.bodyZone, list);
    }
    return Array.from(byZone.entries()).map(([zone, apps]) => {
      const last = apps[apps.length - 1]!;
      return {
        fragranceId: last.id,
        zone,
        label: apps.length > 1 ? `×${apps.length}` : initials(last.perfumeName),
        position: last.position ?? undefined,
        color: colorFor(sessionColors, last.perfumeName),
        stack: apps.map((a) => colorFor(sessionColors, a.perfumeName)),
        dimmed: draft !== null && draft.zone !== zone,
      };
    });
  }, [applications, draft, sessionColors]);

  /** Zones utilisées, avec la couleur du dernier parfum posé. */
  const zonesUsed = useMemo(() => {
    const seen = new Map<BodyZone, { count: number; color: string }>();
    for (const app of applications) {
      seen.set(app.bodyZone, {
        count: (seen.get(app.bodyZone)?.count ?? 0) + 1,
        color: colorFor(sessionColors, app.perfumeName),
      });
    }
    return Array.from(seen.entries());
  }, [applications, sessionColors]);

  /** Légende : parfum → couleur → nombre de poses. */
  const legend = useMemo<LegendEntry[]>(() => {
    const entries = new Map<string, LegendEntry>();
    for (const app of applications) {
      const existing = entries.get(app.perfumeName);
      if (existing) {
        existing.poseCount += 1;
      } else {
        entries.set(app.perfumeName, {
          perfumeName: app.perfumeName,
          color: colorFor(sessionColors, app.perfumeName),
          poseCount: 1,
        });
      }
    }
    return Array.from(entries.values());
  }, [applications, sessionColors]);

  const handleLegendSelect = useCallback(
    (entry: LegendEntry) => {
      // Focus la dernière pose de ce parfum, en pulsant sa zone.
      const poses = applications.filter(
        (a) => a.perfumeName === entry.perfumeName,
      );
      const last = poses[poses.length - 1];
      if (!last) return;
      setLegendActive((prev) =>
        prev === entry.perfumeName ? null : entry.perfumeName,
      );
      if (legendActive === entry.perfumeName) {
        setFocus(null);
        setHighlighted(null);
      } else {
        setFocus(last.position ?? null);
        setHighlighted(last.bodyZone);
      }
    },
    [applications, legendActive],
  );

  // ─── Vol de la photo vers le marqueur (FLIP, Web Animations API) ────
  const flyPhotoToBody = useCallback((from: DOMRect, url: string) => {
    const target = mannequinRef.current?.getBoundingClientRect();
    if (!target) return;
    // La caméra vient de dollier sur le point : le marqueur est au
    // centre du canvas. La photo s'y résorbe.
    const toX = target.left + target.width / 2 - 14;
    const toY = target.top + target.height / 2 - 14;

    const ghost = document.createElement("img");
    ghost.src = url;
    ghost.className = "photo-ghost";
    Object.assign(ghost.style, {
      left: `${from.left}px`,
      top: `${from.top}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
    });
    document.body.appendChild(ghost);

    const animation = ghost.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        {
          transform: `translate(${toX - from.left}px, ${toY - from.top}px) scale(${28 / from.width})`,
          opacity: 0.25,
        },
      ],
      { duration: 620, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
    );
    animation.onfinish = () => ghost.remove();
  }, []);

  // ─── Pose ────────────────────────────────────────────────────────────
  const handleBodyClick = useCallback((zone: BodyZone, position: [number, number, number]) => {
    haptic("medium");
    setLegendActive(null);
    setFocus(position);
    setDraft({ zone, position });
  }, []);

  const handleConfirm = useCallback(
    async (result: PlacementResult) => {
      if (!draft) return;
      try {
      const created = await addApplication({
        walkId: walk.id,
        wishlistItemId: result.wishlistItemId,
        perfumeName: result.perfumeName,
        perfumeHouse: result.perfumeHouse,
        bodyZone: draft.zone,
        position: draft.position,
        photoPath: result.photoPath,
        note: result.note,
      });
      setApplications((prev) => [...prev, created]);
      haptic("success");
      setDraft(null);
      setPreselected(null);
      setHighlighted(draft.zone);
      setTimeout(() => setHighlighted(null), 2600);

      if (result.flyFrom && result.previewUrl) {
        // Laisse le sheet se fermer avant le vol.
        requestAnimationFrame(() =>
          flyPhotoToBody(result.flyFrom!, result.previewUrl!),
        );
      }
      } catch (e) {
        toast(
          e instanceof Error ? e.message : "Pose non enregistrée",
          "error",
        );
      }
    },
    [draft, walk.id, flyPhotoToBody],
  );

  const handleSetVerdict = useCallback((id: string, verdict: Verdict | null) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, verdict } : a)),
    );
    setVerdict(id, verdict).catch(() => {
      toast("Verdict non enregistré — migration 002 appliquée ?", "error");
    });
  }, []);

  const handleAddImpression = useCallback(
    async (app: ApplicationWithInsights, text: string) => {
      try {
        const next = await addImpression(app.id, app.impressions, text);
        setApplications((prev) =>
          prev.map((a) => (a.id === app.id ? { ...a, impressions: next } : a)),
        );
      } catch {
        toast("Impression non enregistrée — migration 002 appliquée ?", "error");
      }
    },
    [],
  );

  const handleDeleteApplication = useCallback(
    async (app: ApplicationWithInsights) => {
      try {
        await deleteApplication(app.id, app.photoPath);
        setApplications((prev) => {
          const next = prev.filter((a) => a.id !== app.id);
          // Plus rien sur cette zone → le sheet n'a plus de sujet.
          if (!next.some((a) => a.bodyZone === app.bodyZone)) {
            setOpenZone(null);
          }
          return next;
        });
        toast("Pose supprimée", "success");
      } catch (e) {
        toast(
          e instanceof Error ? e.message : "Échec de la suppression",
          "error",
        );
      }
    },
    [],
  );

  const handleEnd = useCallback(async () => {
    if (endBusy) return;
    setEndBusy(true);
    try {
      await endWalk(walk.id);
      setEnded(true);
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Impossible de terminer la balade",
        "error",
      );
    } finally {
      setEndBusy(false);
    }
  }, [walk.id, endBusy]);

  const openZoneApps = useMemo(
    () => (openZone ? applications.filter((a) => a.bodyZone === openZone) : []),
    [openZone, applications],
  );

  // Rail wishlist : "à sentir" d'abord, puis le reste.
  const rail = useMemo(() => {
    const order = { to_smell: 0, to_compare: 1, to_buy: 2 } as const;
    return [...wishlist].sort((a, b) => order[a.status] - order[b.status]);
  }, [wishlist]);

  return (
    <div className="flex flex-col gap-4 -mx-5">
      {/* ─── Bandeau session ─── */}
      <div className="flex items-center justify-between px-5">
        <WalkChrono startedAt={walk.startedAt} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Réglages du mannequin"
            onClick={() => setSettingsOpen(true)}
            className="w-8 h-8 rounded-full border-2 border-on-background/40 hover:border-on-background flex items-center justify-center active:scale-95 transition-all"
          >
            <Icon name="tune" size={15} />
          </button>
          <button
            type="button"
            onClick={handleEnd}
            disabled={endBusy}
            className="rounded-full border-2 border-on-background px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all hover:bg-on-background hover:text-background disabled:opacity-50"
          >
            Terminer
          </button>
        </div>
      </div>

      {/* ─── Rail wishlist ─── */}
      {rail.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar px-5">
          {rail.map((item) => {
            const active = preselected?.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPreselected(active ? null : item)}
                className={clsx(
                  "shrink-0 rounded-full border-2 border-on-background px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-150 active:scale-95 inline-flex items-center gap-1.5",
                  active
                    ? "bg-on-background text-background"
                    : "bg-background text-on-background/70",
                )}
              >
                {active && <Icon name="colorize" size={12} />}
                {item.name}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Consigne contextuelle ─── */}
      <p className="px-5 font-cormorant italic text-sm opacity-60 text-center">
        {preselected
          ? `« Touche la zone où tu poses ${preselected.name}. »`
          : "« Touche le corps là où tu appliques le parfum. »"}
      </p>

      {/* ─── Mannequin ─── */}
      <div ref={mannequinRef} className="relative">
        <LazyBodySilhouette3D
          placementMode
          filledMarkers={markers}
          highlightedZone={highlighted ?? draft?.zone ?? null}
          onBodyClick={handleBodyClick}
          poseCount={applications.length}
          focusPoint={focus}
        />
        {focus && (
          <button
            type="button"
            onClick={() => {
              setFocus(null);
              setLegendActive(null);
              setHighlighted(null);
            }}
            className="bubble-in absolute top-2 right-2 px-3 py-1.5 bg-background/95 backdrop-blur border border-outline-variant text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 active:scale-95 transition-transform z-10"
          >
            <Icon name="zoom_out" size={12} />
            Vue d&apos;ensemble
          </button>
        )}
      </div>

      {/* ─── Schéma de session (légende parfum ↔ couleur) ─── */}
      <SessionLegend
        entries={legend}
        activePerfume={legendActive}
        onSelect={handleLegendSelect}
      />

      {/* ─── Zones utilisées (accès layering) ─── */}
      {zonesUsed.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar px-5">
          {zonesUsed.map(([zone, info]) => (
            <button
              key={zone}
              type="button"
              onClick={() => setOpenZone(zone)}
              className="shrink-0 border-2 border-on-background px-3.5 py-2 font-mono text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform inline-flex items-center gap-2 bg-background"
            >
              <span
                aria-hidden
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: info.color }}
              />
              {BODY_ZONE_LABELS[zone]}
              {info.count > 1 && (
                <span className="bg-on-background text-background px-1.5 py-0.5 text-[9px]">
                  ×{info.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ─── Sheets & overlays ─── */}
      <PlacementSheet
        draft={draft}
        wishlist={wishlist}
        preselected={preselected}
        sessionColors={sessionColors}
        onClose={() => setDraft(null)}
        onConfirm={handleConfirm}
      />

      {/* ─── Réglages fluidité (engrenage) ─── */}
      {settingsOpen && (
        <BottomSheet
          open
          onClose={() => setSettingsOpen(false)}
          label="Fluidité"
          title="Réglages du mannequin"
        >
          <MannequinSettingsPanel />
        </BottomSheet>
      )}

      <ZoneStackSheet
        zone={openZone}
        applications={openZoneApps}
        sessionColors={sessionColors}
        onClose={() => setOpenZone(null)}
        onSetVerdict={handleSetVerdict}
        onAddImpression={handleAddImpression}
        onDeleteApplication={handleDeleteApplication}
      />

      {ended && (
        <EndWalkOverlay
          posesCount={applications.length}
          duration={formatDuration(walk.startedAt)}
          onClose={onEnded}
        />
      )}
    </div>
  );
}
