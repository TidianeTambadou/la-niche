import { clsx } from "clsx";
import type { ReactNode } from "react";

/**
 * Label de section — remplace l'ancien style `LA_NICHE://XXX`.
 * Un court filet 2px, puis un libellé espacé en petites capitales mono.
 * Élégant, technique, sans jargon d'URL.
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
        "inline-flex items-center gap-3 font-mono text-[10px] uppercase opacity-55",
        animated ? "hero-label" : "tracking-[0.35em]",
        className,
      )}
    >
      <span aria-hidden className="w-6 h-[2px] bg-on-background shrink-0" />
      {children}
    </span>
  );
}
