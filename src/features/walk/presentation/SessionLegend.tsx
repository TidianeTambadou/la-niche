"use client";

import { clsx } from "clsx";
import { haptic } from "@/shared/lib/haptics";

export type LegendEntry = {
  perfumeName: string;
  color: string;
  poseCount: number;
};

type Props = {
  entries: LegendEntry[];
  /** Parfum actuellement mis en avant (focus caméra). */
  activePerfume: string | null;
  onSelect: (entry: LegendEntry) => void;
};

/**
 * Schéma de session — la légende parfum ↔ couleur, comme sur une carte.
 * Tap sur une entrée : la caméra focus la dernière pose de ce parfum.
 */
export function SessionLegend({ entries, activePerfume, onSelect }: Props) {
  if (entries.length === 0) return null;

  return (
    <div className="px-5 flex flex-col gap-2">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">
        Ta session
      </span>
      <div className="flex flex-wrap gap-2">
        {entries.map((entry, i) => {
          const active = activePerfume === entry.perfumeName;
          return (
            <button
              key={entry.perfumeName}
              type="button"
              onClick={() => {
                haptic("select");
                onSelect(entry);
              }}
              className={clsx(
                "reveal-fade-in inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-extrabold transition-all duration-150 active:scale-95",
                active
                  ? "bg-surface-container-highest ring-2 ring-on-background/60"
                  : "bg-surface-container-low",
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span
                aria-hidden
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="max-w-[130px] truncate">{entry.perfumeName}</span>
              {entry.poseCount > 1 && (
                <span className="text-on-surface-variant">×{entry.poseCount}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
