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
 * Prise de note intelligente — le vocabulaire du parfumeur en pills.
 * Un tap insère le terme (retap = retire), la saisie libre reste reine.
 * Pills actives = coral.
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
    "w-full rounded-2xl bg-surface-container-high px-4 py-3.5 text-sm font-semibold text-on-background placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-pop transition-shadow";

  return (
    <div className="flex flex-col gap-2.5">
      {label && (
        <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">
          {label}
        </span>
      )}

      <div className="-mx-5 flex flex-col gap-1.5 px-5">
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
                    "shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all duration-150 active:scale-95",
                    active
                      ? "select-pop bg-pop text-on-pop"
                      : "bg-surface-container-high text-on-surface-variant hover:text-on-background",
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
