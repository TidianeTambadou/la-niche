import type { ReactNode } from "react";
import { clsx } from "clsx";
import { SectionLabel } from "@/shared/ui/brutalist/SectionLabel";

type Props = {
  /** Libellé de section, ex : "Connexion", "Session en cours". */
  label: ReactNode;
  /** Une ou deux lignes de titre en escalier. */
  titleLines: [string] | [string, string];
  /** Citation Cormorant optionnelle. */
  quote?: string;
  /** Contenu additionnel sous la citation (méta, stats…). */
  children?: ReactNode;
  compact?: boolean;
};

/**
 * Hero d'écran avec cascade cinématique : filet qui se trace, label qui
 * se resserre, lignes du titre qui montent en séquence, citation qui
 * suit. La signature d'entrée de chaque écran de La Niche.
 */
export function ScreenHero({
  label,
  titleLines,
  quote,
  children,
  compact = false,
}: Props) {
  return (
    <header className="relative pl-6">
      <div className="hero-stripe absolute left-0 top-0 bottom-0 w-[2px] bg-on-background" />
      <SectionLabel animated>{label}</SectionLabel>
      <h1
        className={clsx(
          "font-sans font-black tracking-tighter leading-none uppercase mt-2",
          compact ? "text-2xl" : "text-4xl",
        )}
      >
        <span className="hero-line-1 block">{titleLines[0]}</span>
        {titleLines[1] && (
          <span className="hero-line-2 block ml-5">{titleLines[1]}</span>
        )}
      </h1>
      {quote && (
        <p className="hero-quote font-cormorant italic text-base mt-3 max-w-[280px]">
          {quote}
        </p>
      )}
      {children && <div className="hero-body mt-2">{children}</div>}
    </header>
  );
}
