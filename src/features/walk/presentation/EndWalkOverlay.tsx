"use client";

import Link from "next/link";
import { SectionLabel } from "@/shared/ui/brutalist/SectionLabel";

type Props = {
  posesCount: number;
  /** Durée formatée, ex : "38 min" ou "1h12". */
  duration: string;
  onClose: () => void;
};

/**
 * Fin de balade — cascade cinématique `done-screen` : brand, check qui se
 * trace, titre monumental, stats, CTA. Chaque élément entre en séquence
 * (~1.4s au total).
 */
export function EndWalkOverlay({ posesCount, duration, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] bg-background flex items-center justify-center px-8">
      <div className="done-screen flex flex-col items-center text-center gap-5 max-w-xs w-full">
        <div className="done-brand">
          <SectionLabel>La Niche — Mémoire</SectionLabel>
        </div>

        <svg
          className="done-check"
          width="72"
          height="72"
          viewBox="0 0 72 72"
          fill="none"
          aria-hidden
        >
          <rect
            x="4"
            y="4"
            width="64"
            height="64"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="done-check-path"
            d="M22 37 L32 47 L52 26"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="square"
            fill="none"
          />
        </svg>

        <div className="done-title">
          <h2 className="font-sans font-black text-4xl tracking-tighter uppercase leading-none">
            Balade
            <span className="block ml-6">Archivée</span>
          </h2>
          <div className="done-underline h-[3px] bg-on-background mt-3" />
        </div>

        <p className="done-headline font-cormorant italic text-lg opacity-70">
          {posesCount} pose{posesCount > 1 ? "s" : ""} · {duration}
          <br />
          « Chaque essai est désormais mémoire. »
        </p>

        <Link
          href="/journal"
          className="done-cta press-cta w-full font-sans font-semibold text-sm tracking-widest uppercase bg-on-background text-background border-2 border-on-background px-6 py-4 shadow-[4px_4px_0px_0px_currentColor] inline-block"
        >
          Voir le journal →
        </Link>

        <button
          type="button"
          onClick={onClose}
          className="done-thanks font-mono text-xs uppercase tracking-widest opacity-60 hover:opacity-100 underline-offset-4 hover:underline"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
