import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Label de section Club : petit, gras, espacé, gris — sans fioriture.
 */
export function SectionLabel({
  children,
  className,
  animated = false,
}: {
  children: ReactNode;
  className?: string;
  /** Applique l'animation hero-label (resserrement du tracking). */
  animated?: boolean;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 text-[11px] font-extrabold uppercase text-on-surface-variant",
        animated ? "hero-label" : "tracking-[0.14em]",
        className,
      )}
    >
      {children}
    </span>
  );
}
