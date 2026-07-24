import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/presentation/AuthShell";
import { SignupForm } from "@/features/auth/presentation/SignupForm";

export const metadata: Metadata = { title: "Inscription — LA NICHE" };

export default function SignupPage() {
  return (
    <AuthShell
      label="Inscription"
      titleLines={["Nouveau", "Carnet"]}
      quote="« Chaque nez mérite sa mémoire. »"
    >
      <SignupForm />
    </AuthShell>
  );
}
