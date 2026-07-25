/**
 * Palette olfactive — la couleur entre dans la balade (et uniquement là :
 * le reste de l'app reste monochrome). 8 teintes inspirées des matières,
 * lisibles sur fond clair comme sombre.
 *
 * Attribution stable par parfum de la session : 1er parfum posé → ambre,
 * 2e → rose, etc. (cycle au-delà de 8).
 */

export const OLFACTORY_PALETTE = [
  { name: "ambre", hex: "#C8893B" },
  { name: "rose", hex: "#C4566E" },
  { name: "vétiver", hex: "#5E7A52" },
  { name: "encens", hex: "#7561B3" },
  { name: "marine", hex: "#3E6E8E" },
  { name: "safran", hex: "#C2452D" },
  { name: "miel", hex: "#B89B2E" },
  { name: "iris", hex: "#8A7CA8" },
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
