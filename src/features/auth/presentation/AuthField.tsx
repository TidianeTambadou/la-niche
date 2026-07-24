import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
};

/**
 * Champ de formulaire brutalist : label mono au-dessus, input à bordure
 * 2px, focus = ombre décalée pleine. Cf. design system §8.
 */
export function AuthField({ label, name, ...rest }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="font-mono text-xs tracking-widest uppercase opacity-60"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="w-full px-4 py-3 bg-background text-on-background border-2 border-on-background font-mono text-sm rounded-none focus:outline-none focus:shadow-[4px_4px_0px_0px_currentColor] placeholder:opacity-40 transition-shadow"
        {...rest}
      />
    </div>
  );
}
