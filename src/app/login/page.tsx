import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/presentation/AuthShell";
import { LoginForm } from "@/features/auth/presentation/LoginForm";

export const metadata: Metadata = { title: "Connexion — LA NICHE" };

export default function LoginPage() {
  return (
    <AuthShell
      label="Connexion"
      titleLines={["La", "Niche"]}
      quote="« Ton carnet olfactif t'attend. »"
    >
      <LoginForm />
    </AuthShell>
  );
}
