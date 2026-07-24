import type { ReactNode } from "react";
import { GridBackground } from "@/shared/ui/brutalist/GridBackground";
import { ScreenHero } from "@/shared/ui/ScreenHero";

type Props = {
  /** Libellé de section, ex : "Connexion". */
  label: string;
  /** Lignes du titre en escalier. */
  titleLines: [string, string];
  /** Citation Cormorant sous le titre. */
  quote?: string;
  children: ReactNode;
};

/**
 * Habillage commun des écrans d'auth : grid background + hero en cascade
 * cinématique, puis le formulaire qui monte à sa suite.
 */
export function AuthShell({ label, titleLines, quote, children }: Props) {
  return (
    <div className="relative flex flex-col flex-1 items-center justify-center px-6 py-12">
      <GridBackground />

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-10">
        <ScreenHero label={label} titleLines={titleLines} quote={quote} />
        <div className="hero-body">{children}</div>
      </div>
    </div>
  );
}
