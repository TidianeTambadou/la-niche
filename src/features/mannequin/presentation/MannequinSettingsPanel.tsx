"use client";

import { clsx } from "clsx";
import {
  QUALITY_LABELS,
  SPEED_LABELS,
  setMannequinSettings,
  useMannequinSettings,
  type GestureSpeed,
  type MannequinQuality,
} from "@/features/mannequin/domain/settings";
import { haptic } from "@/shared/lib/haptics";

const QUALITIES = Object.keys(QUALITY_LABELS) as MannequinQuality[];
const SPEEDS = Object.keys(SPEED_LABELS) as GestureSpeed[];

function Segmented<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: T[];
  labels: Record<T, string>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => {
            haptic("select");
            onChange(opt);
          }}
          className={clsx(
            "rounded-full border-2 border-on-background px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-150 active:scale-95",
            value === opt
              ? "bg-on-background text-background"
              : "bg-background text-on-background/60 hover:text-on-background",
          )}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}

const labelClass = "font-mono text-xs tracking-widest uppercase opacity-60";

/**
 * Réglages de fluidité du mannequin — appliqués en direct au canvas
 * (le store notifie, le canvas relit). Rendu dans le profil et dans le
 * sheet engrenage pendant la balade.
 */
export function MannequinSettingsPanel() {
  const settings = useMannequinSettings();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className={labelClass}>Qualité graphique</span>
        <Segmented
          options={QUALITIES}
          labels={QUALITY_LABELS}
          value={settings.quality}
          onChange={(quality) => setMannequinSettings({ quality })}
        />
        <p className="text-xs opacity-50 leading-relaxed">
          {settings.quality === "auto"
            ? "L'app mesure la fluidité et s'adapte toute seule à ton téléphone."
            : settings.quality === "eco"
              ? "Ombres et animations coupées — fluidité maximale sur les téléphones modestes."
              : settings.quality === "balanced"
                ? "Le meilleur compromis qualité / fluidité."
                : "Tout activé — pour les téléphones récents."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Vitesse du zoom</span>
        <Segmented
          options={SPEEDS}
          labels={SPEED_LABELS}
          value={settings.zoomSpeed}
          onChange={(zoomSpeed) => setMannequinSettings({ zoomSpeed })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>Vitesse de rotation</span>
        <Segmented
          options={SPEEDS}
          labels={SPEED_LABELS}
          value={settings.rotateSpeed}
          onChange={(rotateSpeed) => setMannequinSettings({ rotateSpeed })}
        />
      </div>
    </div>
  );
}
