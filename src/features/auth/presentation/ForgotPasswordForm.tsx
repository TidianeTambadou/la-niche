"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  requestPasswordReset,
  type AuthState,
} from "@/features/auth/application/actions";
import { AuthField } from "./AuthField";
import { AuthMessage } from "./AuthMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: AuthState = { error: null };

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordReset, initialState);

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

      <AuthMessage state={state} />

      <SubmitButton>Envoyer le lien →</SubmitButton>

      <div className="text-center text-xs font-mono uppercase tracking-widest">
        <Link
          href="/login"
          className="opacity-60 hover:opacity-100 underline-offset-4 hover:underline"
        >
          ← Retour à la connexion
        </Link>
      </div>
    </form>
  );
}
