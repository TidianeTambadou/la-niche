import type { ReactNode } from "react";
import { clsx } from "clsx";
import { SectionLabel } from "@/shared/ui/brutalist/SectionLabel";

type Props = {
  /** Libellé au-dessus du titre, ex : "Carnet d'envies". */
  label: ReactNode;
  /** Une ou deux lignes de titre. */
  titleLines: [string] | [string, string];
  /** Sous-titre optionnel (remplace l'ancienne citation). */
  quote?: string;
  children?: ReactNode;
  compact?: boolean;
};

/**
 * Hero d'écran Club : label bold discret + titre condensé ÉNORME,
 * cascade d'entrée conservée.
 */
export function ScreenHero({
  label,
  titleLines,
  quote,
  children,
  compact = false,
}: Props) {
  return (
    <header>
      <SectionLabel animated>{label}</SectionLabel>
      <h1
        className={clsx(
          "title-mega hero-line-1 mt-1.5",
          compact ? "text-3xl" : "text-5xl",
        )}
      >
        <span className="hero-line-1 block">{titleLines[0]}</span>
        {titleLines[1] && (
          <span className="hero-line-2 block text-pop">{titleLines[1]}</span>
        )}
      </h1>
      {quote && (
        <p className="hero-quote text-sm font-semibold text-on-surface-variant mt-3 max-w-[300px]">
          {quote}
        </p>
      )}
      {children && <div className="hero-body mt-2">{children}</div>}
    </header>
  );
}
