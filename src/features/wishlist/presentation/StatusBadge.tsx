import { clsx } from "clsx";
import {
  WISHLIST_STATUS_LABELS,
  type WishlistStatus,
} from "@/features/wishlist/domain/wishlist-item";

/**
 * Pill de statut Club — coral quand active, carte sinon.
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
        "inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider",
        active
          ? "bg-pop text-on-pop"
          : "bg-surface-container-high text-on-surface-variant",
        className,
      )}
    >
      {WISHLIST_STATUS_LABELS[status]}
    </span>
  );
}

/** Priorité en points : ●○○ basse, ●●○ moyenne, ●●● haute (coral). */
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
      className={clsx("inline-flex items-center gap-1", className)}
      aria-label={`Priorité ${priority}`}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={clsx(
            "h-1.5 w-1.5 rounded-full",
            i < filled ? "bg-pop" : "bg-surface-container-highest",
          )}
        />
      ))}
    </span>
  );
}
