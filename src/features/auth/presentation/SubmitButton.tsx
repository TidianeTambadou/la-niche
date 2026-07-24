"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/**
 * Bouton primaire brutalist branché sur l'état du formulaire parent :
 * pending = désactivé + libellé neutre.
 */
export function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="press-cta font-sans font-semibold text-sm tracking-widest uppercase bg-on-background text-background border-2 border-on-background px-6 py-3.5 rounded-none shadow-[4px_4px_0px_0px_currentColor] disabled:opacity-60 disabled:cursor-wait inline-flex items-center justify-center"
    >
      {pending ? "Un instant…" : children}
    </button>
  );
}
