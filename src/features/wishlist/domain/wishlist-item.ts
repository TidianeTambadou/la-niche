/**
 * Entité Wishlist — un parfum que l'utilisateur veut découvrir,
 * acheter ou comparer.
 */

export type WishlistStatus = "to_smell" | "to_buy" | "to_compare";
export type WishlistPriority = "low" | "medium" | "high";

export const WISHLIST_STATUS_LABELS: Record<WishlistStatus, string> = {
  to_smell: "À sentir",
  to_buy: "À acheter",
  to_compare: "À comparer",
};

export const WISHLIST_PRIORITY_LABELS: Record<WishlistPriority, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
};

export type WishlistItem = {
  id: string;
  userId: string;
  name: string;
  house: string;
  /** Chemin dans le bucket Storage `photos` (jamais une URL publique). */
  photoPath: string | null;
  note: string;
  priority: WishlistPriority;
  status: WishlistStatus;
  createdAt: string;
  updatedAt: string;
};

/** Payload minimal pour l'ajout ultra-rapide : le nom suffit. */
export type NewWishlistItem = {
  name: string;
  house?: string;
  note?: string;
  priority?: WishlistPriority;
  status?: WishlistStatus;
  photoPath?: string | null;
};
