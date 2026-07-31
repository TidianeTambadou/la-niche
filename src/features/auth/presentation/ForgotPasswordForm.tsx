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

      <div className="text-center text-[11px] font-bold">
        <Link
          href="/login"
          className="text-on-surface-variant hover:text-pop transition-colors"
        >
          ← Retour à la connexion
        </Link>
      </div>
    </form>
  );
}
