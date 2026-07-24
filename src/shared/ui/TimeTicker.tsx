"use client";

import { memo } from "react";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** Colonne odomètre : bande verticale 0-9 translatée vers le chiffre. */
function TickerDigit({ value }: { value: number }) {
  return (
    <span className="ticker-column" aria-hidden>
      <span
        className="ticker-strip"
        style={{ transform: `translateY(-${value}em)` }}
      >
        {DIGITS.map((d) => (
          <span key={d} style={{ height: "1em" }}>
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

type Props = {
  /** Texte composé de chiffres et séparateurs, ex : "04:32" ou "128". */
  value: string;
  className?: string;
  label?: string;
};

/**
 * Compteur odomètre : chaque chiffre roule verticalement (420ms, easing
 * design system) comme un compteur mécanique. Les séparateurs (":", " ")
 * sont rendus tels quels.
 */
export const TimeTicker = memo(function TimeTicker({
  value,
  className,
  label,
}: Props) {
  return (
    <span
      className={className}
      role="timer"
      aria-label={label ? `${label} ${value}` : value}
    >
      {value.split("").map((char, i) =>
        /\d/.test(char) ? (
          <TickerDigit key={i} value={Number(char)} />
        ) : (
          <span key={i} aria-hidden>
            {char}
          </span>
        ),
      )}
    </span>
  );
});
