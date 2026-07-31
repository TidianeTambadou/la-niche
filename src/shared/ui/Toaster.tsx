"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";

type ToastKind = "error" | "success" | "info";
type ToastEvent = { id: number; message: string; kind: ToastKind };

const EVENT_NAME = "laniche:toast";
let nextId = 1;

/**
 * Affiche un message furtif. Utilisable partout (composants, repositories) :
 * `toast("Photo enregistrée")` / `toast("Échec de l'upload", "error")`.
 */
export function toast(message: string, kind: ToastKind = "info"): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastEvent>(EVENT_NAME, {
      detail: { id: nextId++, message, kind },
    }),
  );
}

/**
 * Hôte des toasts — monté une fois dans le layout racine. Monochrome :
 * l'erreur est un bloc inversé, le succès un bloc bordé.
 */
export function Toaster() {
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<ToastEvent>).detail;
      setToasts((prev) => [...prev.slice(-2), detail]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, 3800);
    }
    window.addEventListener(EVENT_NAME, onToast);
    return () => window.removeEventListener(EVENT_NAME, onToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed left-4 right-4 z-[90] flex flex-col items-center gap-2 pointer-events-none"
      style={{ bottom: "max(6.5rem, calc(env(safe-area-inset-bottom) + 5.5rem))" }}
      aria-live="polite"
    >
      {toasts.map((t) => (
        <p
          key={t.id}
          className={clsx(
            "bubble-in w-fit max-w-sm rounded-full px-5 py-3 text-center text-sm font-bold",
            t.kind === "error"
              ? "bg-pop text-on-pop"
              : t.kind === "success"
                ? "bg-lime text-on-lime"
                : "bg-surface-container-highest text-on-background",
          )}
        >
          {t.message}
        </p>
      ))}
    </div>
  );
}
