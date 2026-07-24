"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthState } from "@/features/auth/application/actions";
import { AuthField } from "./AuthField";
import { AuthMessage } from "./AuthMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: AuthState = { error: null };

export function SignupForm() {
  const [state, formAction] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <AuthField
        label="Prénom (optionnel)"
        name="display_name"
        type="text"
        autoComplete="given-name"
        placeholder="Tidiane"
      />
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
        autoComplete="new-password"
        placeholder="6 caractères minimum"
        minLength={6}
        required
      />

      <AuthMessage state={state} />

      <SubmitButton>Créer mon carnet →</SubmitButton>

      <div className="text-center text-xs font-mono uppercase tracking-widest">
        <Link
          href="/login"
          className="opacity-60 hover:opacity-100 underline-offset-4 hover:underline"
        >
          Déjà un compte ? Se connecter
        </Link>
      </div>
    </form>
  );
}
