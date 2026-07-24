"use client";

import { useEffect, useState } from "react";
import { TimeTicker } from "@/shared/ui/TimeTicker";

function formatElapsed(startedAt: string): string {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
  );
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Chronomètre de session — digits odomètre qui roulent chaque seconde.
 * Isolé dans son propre composant : le tick ne re-rend jamais le parent
 * (ni le canvas 3D).
 */
export function WalkChrono({ startedAt }: { startedAt: string }) {
  const [value, setValue] = useState(() => formatElapsed(startedAt));

  useEffect(() => {
    const id = setInterval(() => setValue(formatElapsed(startedAt)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="relative inline-flex w-2 h-2">
        <span className="live-pulse absolute inset-0 rounded-full bg-on-background" />
      </span>
      <TimeTicker
        value={value}
        label="Durée de la balade"
        className="font-mono font-bold text-lg tracking-widest tabular-nums"
      />
    </span>
  );
}
