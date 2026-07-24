import type { Metadata } from "next";
import { BaladeScreen } from "@/features/walk/presentation/BaladeScreen";

export const metadata: Metadata = { title: "Balade — LA NICHE" };

export default function BaladePage() {
  return <BaladeScreen />;
}
