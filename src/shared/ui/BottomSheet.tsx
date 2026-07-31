"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { Icon } from "@/shared/ui/Icon";
import { SectionLabel } from "@/shared/ui/brutalist/SectionLabel";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Libellé de section dans l'en-tête (ex : "Nouvelle pose"). */
  label?: string;
  title?: string;
  children: ReactNode;
  /** Applique le stagger `card-section` aux enfants directs. */
  stagger?: boolean;
};

/**
 * Bottom sheet Club : carte sombre aux coins très arrondis qui monte avec
 * un overshoot physique, poignée de drag, titre condensé.
 */
export function BottomSheet({
  open,
  onClose,
  label,
  title,
  children,
  stagger = false,
}: Props) {
  // Verrouille le scroll de la page tant que le sheet est ouvert.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="backdrop-fade-in absolute inset-0 bg-black/60 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="sheet-slide-up relative bg-surface-container-low text-on-background rounded-t-[28px] max-h-[88dvh] overflow-y-auto overscroll-contain"
      >
        {/* Poignée */}
        <div className="sticky top-0 z-10 bg-surface-container-low pt-3 pb-1 flex justify-center">
          <span aria-hidden className="w-10 h-1.5 rounded-full bg-surface-container-highest" />
        </div>
        <header className="flex items-center justify-between gap-4 px-5 pb-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            {label && <SectionLabel>{label}</SectionLabel>}
            {title && (
              <h2 className="title-mega text-2xl truncate">{title}</h2>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center active:scale-95 transition-transform"
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <div
          className={clsx("px-5 py-4 safe-bottom", stagger && "stagger-sheet")}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
