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
 * Tab bar Club : l'onglet actif devient une pilule coral pleine —
 * le pattern signature des apps lifestyle.
 */
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 bg-background/90 backdrop-blur-xl">
      <ul className="flex justify-around items-center w-full app-shell-main mx-auto safe-bottom pt-2.5 px-4">
        {TABS.map((tab) => {
          const active = tab.activeMatch(pathname);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                onClick={() => !active && haptic("select")}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-2 rounded-full transition-all duration-200 active:scale-95",
                  active
                    ? "bg-pop text-on-pop px-5 py-2.5 font-extrabold"
                    : "text-on-surface-variant px-3 py-2.5 hover:text-on-background",
                )}
                style={{
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <Icon name={tab.icon} filled={active} size={20} />
                <span
                  className={clsx(
                    "text-[11px] font-extrabold uppercase tracking-wider",
                    !active && "sr-only",
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
