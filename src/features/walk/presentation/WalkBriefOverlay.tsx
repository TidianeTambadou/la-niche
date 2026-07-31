"use client";

import { PhotoThumb } from "@/shared/ui/PhotoThumb";
import { PriorityDots } from "@/features/wishlist/presentation/StatusBadge";
import type { WishlistItem } from "@/features/wishlist/domain/wishlist-item";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;
const MAX_SHOWN = 5;

type Props = {
  wishlist: WishlistItem[];
  onEnter: () => void;
};

/**
 * Brief d'avant-balade Club — le rappel des parfums à sentir, priorités
 * en tête, un seul geste pour entrer.
 */
export function WalkBriefOverlay({ wishlist, onEnter }: Props) {
  const toSmell = wishlist
    .filter((w) => w.status === "to_smell")
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const shown = toSmell.slice(0, MAX_SHOWN);
  const rest = toSmell.length - shown.length;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-background px-6">
      <div className="done-screen mx-auto flex min-h-full max-w-sm flex-col justify-center gap-4 py-10">
        <div className="done-check rounded-[26px] bg-pop p-6 text-on-pop">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] opacity-80">
            Avant d&apos;entrer
          </p>
          <h2 className="title-mega mt-1 text-5xl">
            À sentir
            <br />
            aujourd&apos;hui
          </h2>
        </div>

        {shown.length > 0 ? (
          <ul className="done-title flex flex-col gap-2.5">
            {shown.map((item, i) => (
              <li
                key={item.id}
                className="reveal-fade-in flex items-center gap-3.5 rounded-[22px] bg-surface-container-low p-3.5"
                style={{ animationDelay: `${500 + i * 100}ms` }}
              >
                <PhotoThumb
                  path={item.photoPath}
                  alt={item.name}
                  className="h-11 w-11 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">{item.name}</p>
                  {item.house && (
                    <p className="truncate text-xs font-medium text-on-surface-variant">
                      {item.house}
                    </p>
                  )}
                </div>
                <PriorityDots priority={item.priority} className="shrink-0" />
              </li>
            ))}
            {rest > 0 && (
              <li
                className="reveal-fade-in text-center text-[11px] font-bold text-on-surface-variant"
                style={{ animationDelay: `${500 + shown.length * 100}ms` }}
              >
                + {rest} autre{rest > 1 ? "s" : ""} dans la wishlist
              </li>
            )}
          </ul>
        ) : (
          <p className="done-title rounded-[22px] bg-surface-container-low p-5 text-center text-sm font-semibold text-on-surface-variant">
            Rien en attente — laisse ton nez décider aujourd&apos;hui 👃
          </p>
        )}

        <button
          type="button"
          onClick={onEnter}
          className="done-cta w-full rounded-full bg-on-background px-6 py-4 text-[13px] font-extrabold uppercase tracking-wider text-on-primary active:scale-95 transition-transform"
        >
          Let&apos;s go →
        </button>
      </div>
    </div>
  );
}
