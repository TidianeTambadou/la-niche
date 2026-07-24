/**
 * Lexique olfactif — vocabulaire du métier organisé en rangées de chips
 * pour la prise de note assistée. Un tap insère (ou retire) le terme.
 */

/** Notes générales : facettes, matières, ressenti. */
export const NOTE_CHIPS: string[][] = [
  // Facettes
  [
    "Ambré",
    "Boisé",
    "Floral",
    "Cuiré",
    "Poudré",
    "Fumé",
    "Épicé",
    "Frais",
    "Sucré",
    "Vert",
    "Musqué",
    "Aquatique",
  ],
  // Matières
  [
    "Vanille",
    "Oud",
    "Rose",
    "Iris",
    "Tabac",
    "Miel",
    "Encens",
    "Santal",
    "Vétiver",
    "Bergamote",
    "Safran",
    "Cerise",
    "Amande",
    "Café",
  ],
  // Ressenti
  [
    "Coup de cœur",
    "Élégant",
    "Entêtant",
    "Discret",
    "Original",
    "Déjà-vu",
    "Signature potentielle",
  ],
];

/** Impressions de drydown : l'évolution dans le temps. */
export const DRYDOWN_CHIPS: string[][] = [
  [
    "S'est adouci",
    "Plus sucré",
    "Plus boisé",
    "Plus poudré",
    "S'est éteint",
    "Tient fort",
  ],
  [
    "Meilleur qu'au départ",
    "Moins intéressant",
    "Sillage énorme",
    "Reste près de la peau",
  ],
];
