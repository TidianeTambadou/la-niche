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

      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest">
        <Link
          href="/mot-de-passe-oublie"
          className="opacity-60 hover:opacity-100 underline-offset-4 hover:underline"
        >
          Mot de passe oublié
        </Link>
        <Link
          href="/inscription"
          className="opacity-60 hover:opacity-100 underline-offset-4 hover:underline"
        >
          Créer un compte
        </Link>
      </div>
    </form>
  );
}
