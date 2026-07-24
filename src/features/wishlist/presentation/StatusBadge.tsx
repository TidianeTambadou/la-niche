import { clsx } from "clsx";
import {
  WISHLIST_STATUS_LABELS,
  type WishlistStatus,
} from "@/features/wishlist/domain/wishlist-item";

/**
 * Chip de statut — arrondi complet (règle Clinical Atelier : sharp sur le
 * layout, full rounding sur boutons/chips). Inversé quand actif.
 */
export function StatusBadge({
  status,
  active = true,
  className,
}: {
  status: WishlistStatus;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border-2 border-on-background px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest whitespace-nowrap",
        active
          ? "bg-on-background text-background"
          : "bg-background text-on-background/60",
        className,
      )}
    >
      {WISHLIST_STATUS_LABELS[status]}
    </span>
  );
}

/** Priorité en points : ●○○ basse, ●●○ moyenne, ●●● haute. */
export function PriorityDots({
  priority,
  className,
}: {
  priority: "low" | "medium" | "high";
  className?: string;
}) {
  const filled = priority === "high" ? 3 : priority === "medium" ? 2 : 1;
  return (
    <span
      className={clsx("inline-flex items-center gap-[3px]", className)}
      aria-label={`Priorité ${priority}`}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={clsx(
            "w-[5px] h-[5px] rounded-full border border-on-background",
            i < filled ? "bg-on-background" : "bg-transparent opacity-40",
          )}
        />
      ))}
    </span>
  );
}
