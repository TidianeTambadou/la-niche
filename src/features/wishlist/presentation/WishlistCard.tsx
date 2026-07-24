"use client";

import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import { clsx } from "clsx";
import type {
  WishlistItem,
  WishlistStatus,
} from "@/features/wishlist/domain/wishlist-item";
import { WISHLIST_STATUS_LABELS } from "@/features/wishlist/domain/wishlist-item";
import { PhotoThumb } from "@/shared/ui/PhotoThumb";
import { haptic } from "@/shared/lib/haptics";
import { PriorityDots } from "./StatusBadge";

const NEXT_STATUS: Record<WishlistStatus, WishlistStatus> = {
  to_smell: "to_buy",
  to_buy: "to_compare",
  to_compare: "to_smell",
};

const SWIPE_THRESHOLD = 72;

type Props = {
  item: WishlistItem;
  onOpen: (item: WishlistItem) => void;
  onCycleStatus: (item: WishlistItem, next: WishlistStatus) => void;
};

/**
 * Carte parfum — maison en exergue mono, nom en gras serré, note en
 * Cormorant, priorité haute signalée par une barre d'accent. Swipe
 * horizontal → cycle du statut avec stamp. Tap = fiche.
 */
export function WishlistCard({ item, onOpen, onCycleStatus }: Props) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [stamped, setStamped] = useState<WishlistStatus | null>(null);
  const startX = useRef<number | null>(null);
  const moved = useRef(false);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    startX.current = e.clientX;
    moved.current = false;
    setDragging(true);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 6) moved.current = true;
    // Rubber band : résistance croissante au-delà du seuil.
    const resisted =
      Math.sign(delta) *
      Math.min(
        Math.abs(delta) * 0.85,
        SWIPE_THRESHOLD + Math.sqrt(Math.abs(delta)) * 3,
      );
    setDragX(resisted);
  }

  function onPointerUp() {
    if (startX.current === null) return;
    const passed = Math.abs(dragX) >= SWIPE_THRESHOLD;
    startX.current = null;
    setDragging(false);
    setDragX(0);

    if (passed) {
      const next = NEXT_STATUS[item.status];
      haptic("success");
      setStamped(next);
      onCycleStatus(item, next);
      setTimeout(() => setStamped(null), 900);
    } else if (!moved.current) {
      onOpen(item);
    }
  }

  return (
    <div className="relative select-none" style={{ touchAction: "pan-y" }}>
      {/* Fond révélé au drag : le statut suivant en filigrane. */}
      <div
        aria-hidden
        className={clsx(
          "absolute inset-0 flex items-center px-5 font-mono text-[10px] font-bold uppercase tracking-widest text-on-background/40 transition-opacity",
          Math.abs(dragX) > 12 ? "opacity-100" : "opacity-0",
          dragX > 0 ? "justify-start" : "justify-end",
        )}
      >
        → {WISHLIST_STATUS_LABELS[NEXT_STATUS[item.status]]}
      </div>

      <div
        role="button"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => e.key === "Enter" && onOpen(item)}
        className={clsx(
          "relative bg-background border-2 border-on-background p-4 pl-5 flex items-center gap-4 cursor-pointer overflow-hidden",
          "shadow-[4px_4px_0px_0px_currentColor]",
          !dragging && "transition-transform duration-300",
        )}
        style={{
          transform: `translateX(${dragX}px)`,
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Barre d'accent : priorité haute. */}
        {item.priority === "high" && (
          <span
            aria-hidden
            className="absolute left-0 top-0 bottom-0 w-[4px] bg-on-background"
          />
        )}

        <PhotoThumb
          path={item.photoPath}
          alt={item.name}
          className="w-[72px] h-[72px] shrink-0"
        />

        <div className="flex-1 min-w-0">
          {item.house && (
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] opacity-50 truncate">
              {item.house}
            </p>
          )}
          <p className="font-sans font-bold text-[15px] tracking-tight truncate mt-0.5">
            {item.name}
          </p>
          {item.note && (
            <p className="font-cormorant italic text-sm opacity-60 truncate mt-0.5">
              « {item.note} »
            </p>
          )}
          <div className="mt-1.5">
            <PriorityDots priority={item.priority} />
          </div>
        </div>

        {/* Stamp après un swipe réussi. */}
        {stamped && (
          <span className="stamp-in absolute right-4 top-1/2 -translate-y-1/2 border-[3px] border-on-background px-2 py-1 font-mono text-[10px] font-black uppercase tracking-widest bg-background">
            {WISHLIST_STATUS_LABELS[stamped]}
          </span>
        )}
      </div>
    </div>
  );
}
