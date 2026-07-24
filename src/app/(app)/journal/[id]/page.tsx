import type { Metadata } from "next";
import { WalkReplayScreen } from "@/features/walk/presentation/WalkReplayScreen";

export const metadata: Metadata = { title: "Replay — LA NICHE" };

/** Next 16 : `params` est une Promise. */
export default async function WalkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WalkReplayScreen walkId={id} />;
}
