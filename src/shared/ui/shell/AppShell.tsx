"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { BottomTabBar } from "./BottomTabBar";

/**
 * Shell authentifié : header glassmorphism + tab bar. Le `key={pathname}`
 * sur le <main> re-monte le contenu à chaque navigation → re-déclenche
 * `page-enter` (fade-up 280ms).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <AppHeader />
      <main
        key={pathname}
        className="app-shell-main page-enter flex-1 pt-24 pb-28 w-full mx-auto px-5"
      >
        {children}
      </main>
      <BottomTabBar />
    </>
  );
}
