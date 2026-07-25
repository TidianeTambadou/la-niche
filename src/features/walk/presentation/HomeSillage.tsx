"use client";

import { useMemo } from "react";

/**
 * Animation signature de la home — 100 % CSS (transform/opacity, GPU) :
 * un flacon qui se dessine en line-draw, des volutes de sillage qui
 * s'élèvent, des molécules qui montent en cascade. Remplace le canvas 3D
 * sur la home : premier paint instantané, zéro coût WebGL.
 */

type Mist = {
  left: string;
  bottom: string;
  size: number;
  dur: string;
  delay: string;
  x: string;
  opacity: number;
};

type Molecule = {
  left: string;
  bottom: string;
  size: number;
  dur: string;
  delay: string;
  x: string;
};

export function HomeSillage() {
  // Positions fixes (pas de Math.random au render — SSR-safe et stable).
  const mists = useMemo<Mist[]>(
    () => [
      { left: "18%", bottom: "26%", size: 90, dur: "7.5s", delay: "0s", x: "14%", opacity: 0.16 },
      { left: "48%", bottom: "22%", size: 130, dur: "9s", delay: "1.2s", x: "-10%", opacity: 0.12 },
      { left: "62%", bottom: "30%", size: 70, dur: "6.5s", delay: "2.4s", x: "8%", opacity: 0.18 },
      { left: "30%", bottom: "18%", size: 110, dur: "8.2s", delay: "3.4s", x: "-6%", opacity: 0.1 },
    ],
    [],
  );

  const molecules = useMemo<Molecule[]>(
    () => [
      { left: "38%", bottom: "38%", size: 4, dur: "4.2s", delay: "0s", x: "18px" },
      { left: "52%", bottom: "42%", size: 3, dur: "5.1s", delay: "0.8s", x: "-14px" },
      { left: "45%", bottom: "36%", size: 5, dur: "4.8s", delay: "1.6s", x: "10px" },
      { left: "58%", bottom: "40%", size: 3, dur: "5.6s", delay: "2.3s", x: "22px" },
      { left: "42%", bottom: "44%", size: 2.5, dur: "4s", delay: "3.1s", x: "-20px" },
      { left: "50%", bottom: "38%", size: 3.5, dur: "5.4s", delay: "3.9s", x: "6px" },
    ],
    [],
  );

  return (
    <div
      className="relative w-full max-w-[380px] mx-auto overflow-hidden flex items-end justify-center"
      style={{ aspectRatio: "3 / 3.2" }}
      aria-hidden
    >
      {/* Volutes de sillage */}
      {mists.map((m, i) => (
        <span
          key={i}
          className="sillage-mist bg-on-background"
          style={{
            left: m.left,
            bottom: m.bottom,
            width: m.size,
            height: m.size,
            animationDelay: m.delay,
            ["--mist-dur" as string]: m.dur,
            ["--mist-x" as string]: m.x,
            ["--mist-opacity" as string]: String(m.opacity),
          }}
        />
      ))}

      {/* Molécules */}
      {molecules.map((m, i) => (
        <span
          key={`mol-${i}`}
          className="molecule-dot text-on-background"
          style={{
            left: m.left,
            bottom: m.bottom,
            width: m.size,
            height: m.size,
            animationDelay: m.delay,
            ["--mol-dur" as string]: m.dur,
            ["--mol-x" as string]: m.x,
          }}
        />
      ))}

      {/* Flacon en line-draw */}
      <svg
        className="line-draw relative z-10 mb-6"
        width="120"
        height="164"
        viewBox="0 0 120 164"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        {/* Bouchon */}
        <rect x="48" y="6" width="24" height="18" />
        {/* Col */}
        <path d="M52 24 L52 40 L68 40 L68 24" />
        {/* Épaules + corps */}
        <path d="M34 54 Q34 40 48 40 L72 40 Q86 40 86 54 L86 138 Q86 152 72 152 L48 152 Q34 152 34 138 Z" />
        {/* Étiquette */}
        <rect x="46" y="84" width="28" height="40" strokeWidth="1.4" />
        {/* Niveau de jus */}
        <line x1="40" y1="70" x2="80" y2="70" strokeDasharray="4 5" strokeWidth="1.4" />
      </svg>
    </div>
  );
}
