import type { ReactNode } from "react";
import { ScreenHero } from "@/shared/ui/ScreenHero";

type Props = {
  /** Libellé de section, ex : "Connexion". */
  label: string;
  /** Lignes du titre. */
  titleLines: [string, string];
  /** Sous-titre optionnel. */
  quote?: string;
  children: ReactNode;
};

/**
 * Habillage des écrans d'auth — DA Club : fond charbon, titre condensé
 * énorme avec la 2e ligne en coral, formulaire en cartes rondes.
 */
export function AuthShell({ label, titleLines, quote, children }: Props) {
  return (
    <div className="relative flex flex-col flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-9">
        <ScreenHero label={label} titleLines={titleLines} quote={quote} />
        <div className="hero-body">{children}</div>
      </div>
    </div>
  );
}
