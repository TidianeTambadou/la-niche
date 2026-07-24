"use client";

import Link from "next/link";
import { Icon } from "@/shared/ui/Icon";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

/**
 * Header fixe glassmorphism (blanc 70 % + blur 20px — signature Clinical
 * Atelier). Marque à gauche, accès profil à droite.
 */
export function AppHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/70 backdrop-blur-xl border-b-2 border-on-background">
      <div className="app-shell-main mx-auto flex items-center justify-between px-5 safe-top pb-3">
        <Link href="/" className="flex items-baseline gap-2 active:scale-95 transition-transform">
          <span className="font-sans font-black text-lg tracking-tighter uppercase leading-none">
            La Niche
          </span>
          <span className="font-mono text-[9px] tracking-widest uppercase opacity-40">
            Carnet olfactif
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/profil"
            aria-label="Profil"
            className="w-9 h-9 border-2 border-on-background flex items-center justify-center active:scale-95 transition-transform"
          >
            <Icon name="person" size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
