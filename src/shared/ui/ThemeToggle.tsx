"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Icon } from "@/shared/ui/Icon";

const emptySubscribe = () => () => {};

/** Détection d'hydratation sans setState-dans-effet. */
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * Bascule light/dark — icône lune/soleil avec pop de sélection.
 * Rendue seulement après montage (hydratation next-themes).
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <span className="w-9 h-9 border-2 border-on-background/20" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      className="w-9 h-9 border-2 border-on-background flex items-center justify-center active:scale-95 transition-transform"
    >
      <Icon
        key={String(isDark)}
        name={isDark ? "light_mode" : "dark_mode"}
        size={17}
        className="select-pop"
      />
    </button>
  );
}
