"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/**
 * CTA principal Club : pilule coral pleine, feedback scale au tap.
 */
export function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-pop px-6 py-4 text-[13px] font-extrabold uppercase tracking-wider text-on-pop active:scale-95 transition-transform disabled:opacity-60"
    >
      {pending ? "Un instant…" : children}
    </button>
  );
}
