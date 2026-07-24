/**
 * Empty state : flacon de parfum qui se dessine en line-draw
 * (stroke-dashoffset), accompagné d'une citation Cormorant.
 */
export function EmptyBottle({ quote }: { quote: string }) {
  return (
    <div className="flex flex-col items-center gap-6 py-14 reveal-fade-in">
      <svg
        className="line-draw"
        width="72"
        height="96"
        viewBox="0 0 72 96"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        {/* Bouchon */}
        <rect x="28" y="4" width="16" height="12" />
        {/* Col */}
        <path d="M31 16 L31 26 L41 26 L41 16" />
        {/* Corps du flacon */}
        <path d="M20 34 Q20 26 28 26 L44 26 Q52 26 52 34 L52 82 Q52 90 44 90 L28 90 Q20 90 20 82 Z" />
        {/* Niveau de jus */}
        <line x1="26" y1="58" x2="46" y2="58" strokeDasharray="3 4" />
      </svg>
      <p className="font-cormorant italic text-base opacity-60 text-center max-w-[240px]">
        {quote}
      </p>
    </div>
  );
}
