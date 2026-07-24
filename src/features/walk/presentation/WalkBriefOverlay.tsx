"use client";

import { SectionLabel } from "@/shared/ui/brutalist/SectionLabel";
import { PhotoThumb } from "@/shared/ui/PhotoThumb";
import { Icon } from "@/shared/ui/Icon";
import { PriorityDots } from "@/features/wishlist/presentation/StatusBadge";
import type { WishlistItem } from "@/features/wishlist/domain/wishlist-item";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;
const MAX_SHOWN = 5;

type Props = {
  wishlist: WishlistItem[];
  onEnter: () => void;
};

/**
 * Brief d'avant-balade — le court rappel des parfums à sentir, affiché
 * juste après l'ouverture de la session. Cascade `done-screen`, priorités
 * en tête, un seul geste pour entrer en boutique.
 */
export function WalkBriefOverlay({ wishlist, onEnter }: Props) {
  const toSmell = wishlist
    .filter((w) => w.status === "to_smell")
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const shown = toSmell.slice(0, MAX_SHOWN);
  const rest = toSmell.length - shown.length;

  return (
    <div className="fixed inset-0 z-[60] bg-background flex items-center justify-center px-7 overflow-y-auto">
      <div className="done-screen flex flex-col gap-5 max-w-sm w-full py-10">
        <div className="done-brand">
          <SectionLabel>Avant d&apos;entrer</SectionLabel>
        </div>

        <div className="done-title">
          <h2 className="font-sans font-black text-3xl tracking-tighter uppercase leading-none">
            À sentir
            <span className="block ml-5">Aujourd&apos;hui</span>
          </h2>
          <div className="done-underline h-[3px] bg-on-background mt-3 max-w-[120px]" />
        </div>

        {shown.length > 0 ? (
          <ul className="done-headline flex flex-col gap-2.5">
            {shown.map((item, i) => (
              <li
                key={item.id}
                className="reveal-fade-in flex items-center gap-3.5 border-2 border-on-background p-3"
                style={{ animationDelay: `${700 + i * 110}ms` }}
              >
                <PhotoThumb
                  path={item.photoPath}
                  alt={item.name}
                  className="w-11 h-11 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-bold text-sm tracking-tight truncate">
                    {item.name}
                  </p>
                  {item.house && (
                    <p className="font-cormorant italic text-sm opacity-60 truncate">
                      {item.house}
                    </p>
                  )}
                </div>
                <PriorityDots priority={item.priority} className="shrink-0" />
              </li>
            ))}
            {rest > 0 && (
              <li
                className="reveal-fade-in text-center font-mono text-[10px] uppercase tracking-widest opacity-50"
                style={{ animationDelay: `${700 + shown.length * 110}ms` }}
              >
                + {rest} autre{rest > 1 ? "s" : ""} dans la wishlist
              </li>
            )}
          </ul>
        ) : (
          <p className="done-headline font-cormorant italic text-lg opacity-70">
            « Rien en attente — laisse ton nez décider aujourd&apos;hui. »
          </p>
        )}

        <button
          type="button"
          onClick={onEnter}
          className="done-cta press-cta w-full font-sans font-semibold text-sm tracking-widest uppercase bg-on-background text-background border-2 border-on-background px-6 py-4 shadow-[4px_4px_0px_0px_currentColor] inline-flex items-center justify-center gap-2"
        >
          <Icon name="colorize" size={16} />
          C&apos;est parti →
        </button>
      </div>
    </div>
  );
}
