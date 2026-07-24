import type { Metadata } from "next";
import { JournalScreen } from "@/features/walk/presentation/JournalScreen";

export const metadata: Metadata = { title: "Journal — LA NICHE" };

export default function JournalPage() {
  return <JournalScreen />;
}
