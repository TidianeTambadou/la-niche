"use client";

import { useSyncExternalStore } from "react";

/**
 * Réglages de fluidité du mannequin — persistés en localStorage, lus par
 * le canvas 3D et modifiables en direct (profil + engrenage en balade).
 */

export type MannequinQuality = "auto" | "eco" | "balanced" | "max";
export type GestureSpeed = "slow" | "normal" | "fast";

export type MannequinSettings = {
  quality: MannequinQuality;
  zoomSpeed: GestureSpeed;
  rotateSpeed: GestureSpeed;
};

export const QUALITY_LABELS: Record<MannequinQuality, string> = {
  auto: "Auto",
  eco: "Éco",
  balanced: "Équilibré",
  max: "Maximum",
};

export const SPEED_LABELS: Record<GestureSpeed, string> = {
  slow: "Lente",
  normal: "Normale",
  fast: "Rapide",
};

export const ZOOM_SPEED_VALUES: Record<GestureSpeed, number> = {
  slow: 0.45,
  normal: 0.7,
  fast: 1.0,
};

export const ROTATE_SPEED_VALUES: Record<GestureSpeed, number> = {
  slow: 0.6,
  normal: 0.9,
  fast: 1.3,
};

/** Profil de rendu résolu à partir du tier de qualité. */
export type RenderProfile = {
  /** Bornes de résolution [min, max] (fraction du devicePixelRatio). */
  dprRange: [number, number];
  shadows: boolean;
  /** Halos/pulses animés des marqueurs et points de zones. */
  markerAnimations: boolean;
  /** Adaptation dynamique via PerformanceMonitor. */
  adaptive: boolean;
};

export function resolveProfile(quality: MannequinQuality): RenderProfile {
  switch (quality) {
    case "eco":
      return {
        dprRange: [0.75, 1],
        shadows: false,
        markerAnimations: false,
        adaptive: false,
      };
    case "balanced":
      return {
        dprRange: [1, 1.25],
        shadows: true,
        markerAnimations: true,
        adaptive: false,
      };
    case "max":
      return {
        dprRange: [1, 2],
        shadows: true,
        markerAnimations: true,
        adaptive: false,
      };
    case "auto":
    default:
      return {
        dprRange: [0.75, 1.5],
        shadows: true,
        markerAnimations: true,
        adaptive: true,
      };
  }
}

// ─── Store minimal (useSyncExternalStore, pas de setState-in-effect) ────

const STORAGE_KEY = "laniche:mannequin-settings";

const DEFAULTS: MannequinSettings = {
  quality: "auto",
  zoomSpeed: "normal",
  rotateSpeed: "normal",
};

let current: MannequinSettings = DEFAULTS;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) current = { ...DEFAULTS, ...(JSON.parse(raw) as object) };
  } catch {
    // Storage indisponible : on reste sur les défauts.
  }
}

export function getMannequinSettings(): MannequinSettings {
  hydrate();
  return current;
}

export function setMannequinSettings(
  patch: Partial<MannequinSettings>,
): void {
  hydrate();
  current = { ...current, ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Best-effort.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Hook réactif : re-render à chaque changement de réglage. */
export function useMannequinSettings(): MannequinSettings {
  return useSyncExternalStore(
    subscribe,
    getMannequinSettings,
    () => DEFAULTS,
  );
}
