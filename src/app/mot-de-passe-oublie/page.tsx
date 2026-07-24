import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/presentation/AuthShell";
import { ForgotPasswordForm } from "@/features/auth/presentation/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié — LA NICHE",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      label="Récupération"
      titleLines={["Mot de", "Passe"]}
      quote="« Un lien, et tout revient. »"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
