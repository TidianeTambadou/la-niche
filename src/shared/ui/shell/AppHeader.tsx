"use client";

import Link from "next/link";
import { Icon } from "@/shared/ui/Icon";

/**
 * Header Club : wordmark condensé avec le "NICHE" en coral, avatar rond.
 * Fond charbon, pas de bordure dure — la séparation se fait par la couleur.
 */
export function AppHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/85 backdrop-blur-xl">
      <div className="app-shell-main mx-auto flex items-center justify-between px-5 safe-top pb-2.5">
        <Link href="/" className="active:scale-95 transition-transform">
          <span className="title-mega text-[22px] leading-none">
            La<span className="text-pop">Niche</span>
          </span>
        </Link>
        <Link
          href="/profil"
          aria-label="Profil"
          className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-pop active:scale-95 transition-transform"
        >
          <Icon name="person" size={18} filled />
        </Link>
      </div>
    </header>
  );
}
