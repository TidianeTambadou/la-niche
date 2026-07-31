/**
 * Empty state Club : flacon en line-draw dans une carte, message direct.
 */
export function EmptyBottle({ quote }: { quote: string }) {
  return (
    <div className="reveal-fade-in flex flex-col items-center gap-5 rounded-[26px] bg-surface-container-low px-6 py-12">
      <svg
        className="line-draw text-on-surface-variant"
        width="64"
        height="86"
        viewBox="0 0 72 96"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <rect x="28" y="4" width="16" height="12" rx="3" />
        <path d="M31 16 L31 26 L41 26 L41 16" />
        <path d="M20 34 Q20 26 28 26 L44 26 Q52 26 52 34 L52 82 Q52 90 44 90 L28 90 Q20 90 20 82 Z" />
        <line x1="26" y1="58" x2="46" y2="58" strokeDasharray="3 4" />
      </svg>
      <p className="max-w-[240px] text-center text-sm font-semibold text-on-surface-variant">
        {quote}
      </p>
    </div>
  );
}
