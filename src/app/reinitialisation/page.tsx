import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/presentation/AuthShell";
import { ResetPasswordForm } from "@/features/auth/presentation/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Nouveau mot de passe — LA NICHE",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      label="Nouveau départ"
      titleLines={["Nouveau", "Départ"]}
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
