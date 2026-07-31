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
 * Chronomètre de session — digits odomètre lime, badge LIVE coral.
 * Isolé : le tick ne re-rend jamais le parent (ni le canvas 3D).
 */
export function WalkChrono({ startedAt }: { startedAt: string }) {
  const [value, setValue] = useState(() => formatElapsed(startedAt));

  useEffect(() => {
    const id = setInterval(() => setValue(formatElapsed(startedAt)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">
        <span className="live-pulse inline-block h-2 w-2 rounded-full bg-pop" />
        Live
      </span>
      <TimeTicker
        value={value}
        label="Durée de la balade"
        className="title-mega text-[22px] text-lime tabular-nums"
      />
    </span>
  );
}
