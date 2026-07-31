"use client";

import Link from "next/link";

type Props = {
  posesCount: number;
  /** Durée formatée, ex : "38 min" ou "1h12". */
  duration: string;
  onClose: () => void;
};

/**
 * Fin de balade Club — carte lime qui claque, stats en gros, CTA pill.
 * La cascade `done-screen` orchestre l'entrée de chaque élément.
 */
export function EndWalkOverlay({ posesCount, duration, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background px-6">
      <div className="done-screen flex w-full max-w-sm flex-col gap-4">
        <div className="done-check rounded-[26px] bg-lime p-7 text-on-lime">
          <h2 className="title-mega text-6xl">Pliée.</h2>
          <p className="mt-2 text-sm font-bold opacity-80">
            Ta balade est dans le journal
          </p>
        </div>

        <div className="done-title grid grid-cols-2 gap-3">
          <div className="rounded-[22px] bg-surface-container-low p-4">
            <div className="title-mega text-4xl text-pop">{posesCount}</div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Pose{posesCount > 1 ? "s" : ""}
            </div>
          </div>
          <div className="rounded-[22px] bg-surface-container-low p-4">
            <div className="title-mega text-4xl">{duration}</div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              De session
            </div>
          </div>
        </div>

        <Link
          href="/journal"
          className="done-cta block rounded-full bg-on-background px-6 py-4 text-center text-[13px] font-extrabold uppercase tracking-wider text-on-primary active:scale-95 transition-transform"
        >
          Voir le journal →
        </Link>

        <button
          type="button"
          onClick={onClose}
          className="done-thanks text-center text-[12px] font-bold text-on-surface-variant hover:text-on-background transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
