"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { Icon } from "@/shared/ui/Icon";
import { haptic } from "@/shared/lib/haptics";

type Tab = {
  href: string;
  label: string;
  icon: string;
  activeMatch: (pathname: string) => boolean;
};

const TABS: Tab[] = [
  {
    href: "/",
    label: "Balade",
    icon: "directions_walk",
    activeMatch: (p) => p === "/",
  },
  {
    href: "/wishlist",
    label: "Wishlist",
    icon: "favorite",
    activeMatch: (p) => p.startsWith("/wishlist"),
  },
  {
    href: "/journal",
    label: "Journal",
    icon: "auto_stories",
    activeMatch: (p) => p.startsWith("/journal"),
  },
];

/**
 * Tab bar fixe : bordure 2px, indicateur trait épais qui pousse depuis le
 * centre, icône filled + label mono en état actif. Pattern v2 à
 * l'identique.
 */
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 bg-background border-t-2 border-on-background">
      <ul className="flex justify-around items-stretch w-full app-shell-main mx-auto safe-bottom">
        {TABS.map((tab) => {
          const active = tab.activeMatch(pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                onClick={() => !active && haptic("select")}
                className={clsx(
                  "relative group flex flex-col items-center gap-1 pt-3 pb-2.5 px-2 transition-colors duration-150",
                  active
                    ? "text-on-background"
                    : "text-on-background/50 hover:text-on-background/90",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  aria-hidden
                  className={clsx(
                    "absolute top-0 left-1/2 -translate-x-1/2 h-[3px] bg-on-background transition-all duration-200 ease-out",
                    active ? "w-8" : "w-0",
                  )}
                />
                <Icon
                  name={tab.icon}
                  filled={active}
                  size={active ? 22 : 20}
                  className="transition-all duration-150"
                />
                <span
                  className={clsx(
                    "font-mono text-[10px] uppercase tracking-[0.18em] transition-all duration-150",
                    active ? "font-bold" : "font-medium",
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
