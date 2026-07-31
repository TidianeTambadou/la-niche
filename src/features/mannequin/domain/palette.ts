/**
 * Palette olfactive — la couleur entre dans la balade (et uniquement là :
 * le reste de l'app reste monochrome). 8 teintes inspirées des matières,
 * lisibles sur fond clair comme sombre.
 *
 * Attribution stable par parfum de la session : 1er parfum posé → ambre,
 * 2e → rose, etc. (cycle au-delà de 8).
 */

export const OLFACTORY_PALETTE = [
  { name: "coral", hex: "#FF4D5A" },
  { name: "lime", hex: "#D4F24B" },
  { name: "cyan", hex: "#4DD8FF" },
  { name: "violet", hex: "#B784FF" },
  { name: "mangue", hex: "#FF9F45" },
  { name: "bubblegum", hex: "#FF6FB3" },
  { name: "menthe", hex: "#59E6A8" },
  { name: "citron", hex: "#FFD84D" },
] as const;

export function perfumeColor(index: number): string {
  return OLFACTORY_PALETTE[index % OLFACTORY_PALETTE.length].hex;
}

/**
 * Attribue une couleur à chaque parfum dans l'ordre de première apparition.
 * Clé = nom du parfum (insensible à la casse).
 */
export function assignSessionColors(
  perfumeNames: string[],
): Map<string, string> {
  const colors = new Map<string, string>();
  for (const name of perfumeNames) {
    const key = name.trim().toLowerCase();
    if (!colors.has(key)) {
      colors.set(key, perfumeColor(colors.size));
    }
  }
  return colors;
}

export function colorFor(
  colors: Map<string, string>,
  perfumeName: string,
): string {
  return colors.get(perfumeName.trim().toLowerCase()) ?? "#8A8272";
}

/**
 * Couleur qu'AURA un parfum : la sienne s'il est déjà posé, sinon la
 * prochaine du cycle. Sert à montrer la pastille avant la confirmation.
 */
export function upcomingColor(
  colors: Map<string, string>,
  perfumeName: string,
): string {
  const key = perfumeName.trim().toLowerCase();
  return colors.get(key) ?? perfumeColor(colors.size);
}
