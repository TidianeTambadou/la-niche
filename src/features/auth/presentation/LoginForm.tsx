"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthState } from "@/features/auth/application/actions";
import { AuthField } from "./AuthField";
import { AuthMessage } from "./AuthMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: AuthState = { error: null };

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <AuthField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="toi@exemple.fr"
        required
      />
      <AuthField
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        required
      />

      <AuthMessage state={state} />

      <SubmitButton>Entrer →</SubmitButton>

      <div className="flex items-center justify-between text-[11px] font-bold">
        <Link
          href="/mot-de-passe-oublie"
          className="text-on-surface-variant hover:text-pop transition-colors"
        >
          Mot de passe oublié
        </Link>
        <Link
          href="/inscription"
          className="text-on-surface-variant hover:text-pop transition-colors"
        >
          Créer un compte
        </Link>
      </div>
    </form>
  );
}
