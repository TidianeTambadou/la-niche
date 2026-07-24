import type { Metadata } from "next";
import { ProfileScreen } from "@/features/auth/presentation/ProfileScreen";

export const metadata: Metadata = { title: "Profil — LA NICHE" };

export default function ProfilPage() {
  return <ProfileScreen />;
}
