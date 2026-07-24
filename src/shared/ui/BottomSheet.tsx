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
 * Bottom sheet clinique : backdrop 40 % + panneau qui monte du bas
 * (`sheet-slide-up`, 450ms, easing design system). Coins nets, bordure
 * 2px sur le dessus. Ferme au tap sur le backdrop ou sur ✕.
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
        className="backdrop-fade-in absolute inset-0 bg-on-background/40 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="sheet-slide-up relative bg-background text-on-background border-t-2 border-on-background max-h-[88dvh] overflow-y-auto overscroll-contain"
      >
        <header className="sticky top-0 z-10 bg-background flex items-center justify-between gap-4 px-5 pt-4 pb-3 border-b-2 border-on-background">
          <div className="flex flex-col gap-0.5 min-w-0">
            {label && <SectionLabel>{label}</SectionLabel>}
            {title && (
              <h2 className="font-sans font-black text-xl tracking-tighter uppercase truncate">
                {title}
              </h2>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 w-9 h-9 border-2 border-on-background flex items-center justify-center active:scale-95 transition-transform"
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <div
          className={clsx("px-5 py-5 safe-bottom", stagger && "stagger-sheet")}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
