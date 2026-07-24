/**
 * Zones anatomiques où un parfum peut être appliqué.
 *
 * Le mannequin 3D classifie chaque point cliqué vers la zone la plus
 * proche — ces identifiants stables servent au layering, à l'historique
 * et aux statistiques, indépendamment de la position 3D exacte.
 */
export type BodyZone =
  // Head / neck
  | "behind-ear-left"
  | "behind-ear-right"
  | "neck-left"
  | "neck-right"
  | "throat"
  | "nape"
  // Torso
  | "chest"
  // Arms
  | "inner-elbow-left"
  | "inner-elbow-right"
  | "outer-elbow-left"
  | "outer-elbow-right"
  // Hands
  | "wrist-left"
  | "wrist-right"
  | "back-of-hand-left"
  | "back-of-hand-right";

export const BODY_ZONE_LABELS: Record<BodyZone, string> = {
  "behind-ear-left": "Derrière l'oreille — gauche",
  "behind-ear-right": "Derrière l'oreille — droite",
  "neck-left": "Cou — gauche",
  "neck-right": "Cou — droite",
  throat: "Creux du cou",
  nape: "Nuque",
  chest: "Buste",
  "inner-elbow-left": "Pli du coude — gauche",
  "inner-elbow-right": "Pli du coude — droite",
  "outer-elbow-left": "Dos du coude — gauche",
  "outer-elbow-right": "Dos du coude — droite",
  "wrist-left": "Poignet — gauche",
  "wrist-right": "Poignet — droite",
  "back-of-hand-left": "Dos de la main — gauche",
  "back-of-hand-right": "Dos de la main — droite",
};

export const ALL_BODY_ZONES = Object.keys(BODY_ZONE_LABELS) as BodyZone[];
