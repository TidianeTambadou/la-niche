"use client";

import { clsx } from "clsx";
import { haptic } from "@/shared/lib/haptics";

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Rangées de chips de vocabulaire (cf. olfactory-lexicon). */
  chips: string[][];
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  /** Soumission à Entrée (champ une ligne uniquement). */
  onSubmit?: () => void;
};

/** Le terme est-il déjà présent dans la note ? */
function hasTerm(value: string, term: string): boolean {
  return value.toLowerCase().includes(term.toLowerCase());
}

/** Insère ou retire un terme, en gérant proprement les virgules. */
function toggleTerm(value: string, term: string): string {
  if (hasTerm(value, term)) {
    const pattern = new RegExp(
      `(?:,\\s*)?${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
      "i",
    );
    return value
      .replace(pattern, "")
      .replace(/^\s*,\s*/, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  if (!value.trim()) return term;
  return `${value.replace(/[,\s]+$/, "")}, ${term.toLowerCase()}`;
}

/**
 * Prise de note intelligente — le vocabulaire du parfumeur en chips
 * au-dessus du champ. Un tap insère le terme (retap = retire), la saisie
 * libre reste reine. Chips actives = déjà dans la note (inversées).
 */
export function SmartNoteField({
  value,
  onChange,
  chips,
  placeholder,
  label,
  multiline = false,
  onSubmit,
}: Props) {
  const fieldClass =
    "w-full px-4 py-3 bg-background text-on-background border-2 border-on-background font-mono text-sm rounded-none focus:outline-none focus:shadow-[4px_4px_0px_0px_currentColor] placeholder:opacity-40 transition-shadow";

  return (
    <div className="flex flex-col gap-2.5">
      {label && (
        <span className="font-mono text-xs tracking-widest uppercase opacity-60">
          {label}
        </span>
      )}

      <div className="flex flex-col gap-1.5 -mx-5 px-5">
        {chips.map((row, i) => (
          <div key={i} className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {row.map((term) => {
              const active = hasTerm(value, term);
              return (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    haptic("select");
                    onChange(toggleTerm(value, term));
                  }}
                  className={clsx(
                    "shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-all duration-150 active:scale-95",
                    active
                      ? "select-pop bg-on-background text-background border-on-background font-bold"
                      : "bg-background text-on-background/60 border-on-background/40 hover:border-on-background hover:text-on-background",
                  )}
                >
                  {term}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className={clsx(fieldClass, "resize-none")}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
          placeholder={placeholder}
          className={fieldClass}
        />
      )}
    </div>
  );
}
