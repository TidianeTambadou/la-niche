import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
};

/**
 * Champ Club : label bold discret, input arrondi sur carte sombre,
 * focus = anneau coral.
 */
export function AuthField({ label, name, ...rest }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="w-full rounded-2xl bg-surface-container-low px-4 py-3.5 text-sm font-semibold text-on-background placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-pop transition-shadow"
        {...rest}
      />
    </div>
  );
}
