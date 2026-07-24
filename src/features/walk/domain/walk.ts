import type { BodyZone } from "@/features/mannequin/domain/body-zones";

/**
 * Entités Balade olfactive — une session de test en parfumerie,
 * et les poses (applications de parfum) qui la composent.
 */

export type Walk = {
  id: string;
  userId: string;
  title: string;
  location: string;
  startedAt: string;
  /** null tant que la balade est en cours. */
  endedAt: string | null;
  createdAt: string;
};

export type WalkApplication = {
  id: string;
  walkId: string;
  userId: string;
  /** Lien optionnel vers la wishlist (le parfum peut être hors wishlist). */
  wishlistItemId: string | null;
  perfumeName: string;
  perfumeHouse: string;
  /** Zone anatomique stable — sert au layering et aux statistiques. */
  bodyZone: BodyZone;
  /** Position 3D exacte du clic sur le mannequin (mètres, repère scène). */
  position: [number, number, number] | null;
  /** Photo du flacon = marqueur visuel de la pose (chemin Storage). */
  photoPath: string | null;
  note: string;
  appliedAt: string;
};

export type NewWalkApplication = {
  walkId: string;
  wishlistItemId?: string | null;
  perfumeName: string;
  perfumeHouse?: string;
  bodyZone: BodyZone;
  position?: [number, number, number] | null;
  photoPath?: string | null;
  note?: string;
};

/** Une balade est "active" tant qu'elle n'est pas terminée. */
export function isWalkActive(walk: Walk): boolean {
  return walk.endedAt === null;
}

/** Groupe les poses par zone — une pile = layering sur la même zone. */
export function groupApplicationsByZone(
  applications: WalkApplication[],
): Map<BodyZone, WalkApplication[]> {
  const groups = new Map<BodyZone, WalkApplication[]>();
  for (const app of applications) {
    const list = groups.get(app.bodyZone) ?? [];
    list.push(app);
    groups.set(app.bodyZone, list);
  }
  return groups;
}
