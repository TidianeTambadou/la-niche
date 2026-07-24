import type { Metadata } from "next";
import { WishlistScreen } from "@/features/wishlist/presentation/WishlistScreen";

export const metadata: Metadata = { title: "Wishlist — LA NICHE" };

export default function WishlistPage() {
  return <WishlistScreen />;
}
