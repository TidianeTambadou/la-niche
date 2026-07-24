"use client";

import { useActionState } from "react";
import {
  updatePassword,
  type AuthState,
} from "@/features/auth/application/actions";
import { AuthField } from "./AuthField";
import { AuthMessage } from "./AuthMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: AuthState = { error: null };

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <AuthField
        label="Nouveau mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="6 caractères minimum"
        minLength={6}
        required
      />
      <AuthField
        label="Confirmer"
        name="confirm"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        minLength={6}
        required
      />

      <AuthMessage state={state} />

      <SubmitButton>Mettre à jour →</SubmitButton>
    </form>
  );
}
