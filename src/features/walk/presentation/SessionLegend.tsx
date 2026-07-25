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
    <div className="px-5 flex flex-col gap-1.5">
      <span className="font-mono text-[9px] uppercase tracking-[0.3em] opacity-40">
        Schéma de la session
      </span>
      <div className="flex flex-wrap gap-1.5">
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
                "reveal-fade-in inline-flex items-center gap-2 border-2 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-150 active:scale-95 bg-background",
                active ? "border-on-background" : "border-on-background/30",
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span
                aria-hidden
                className="w-3 h-3 rounded-full border border-background shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate max-w-[130px]">{entry.perfumeName}</span>
              {entry.poseCount > 1 && (
                <span className="opacity-50">×{entry.poseCount}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
