"use client";

import { useCallback, useEffect, useState } from "react";
import { ScreenHero } from "@/shared/ui/ScreenHero";
import { HomeSillage } from "./HomeSillage";
import type { Walk } from "@/features/walk/domain/walk";
import type { WishlistItem } from "@/features/wishlist/domain/wishlist-item";
import {
  getActiveWalk,
  listApplications,
  startWalk,
  type ApplicationWithInsights,
} from "@/features/walk/infrastructure/walk-repository";
import { listWishlist } from "@/features/wishlist/infrastructure/wishlist-repository";
import { haptic } from "@/shared/lib/haptics";
import { toast } from "@/shared/ui/Toaster";
import { ActiveWalk } from "./ActiveWalk";
import { WalkBriefOverlay } from "./WalkBriefOverlay";

type State =
  | { phase: "loading" }
  | { phase: "idle" }
  | {
      phase: "active";
      walk: Walk;
      applications: ApplicationWithInsights[];
    };

/**
 * Hub Balade : session active si elle existe, sinon hero contemplatif —
 * mannequin qui respire (`daily-float`) + démarrage en un seul geste.
 */
export function BaladeScreen() {
  const [state, setState] = useState<State>({ phase: "loading" });
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [starting, setStarting] = useState(false);
  /** Brief d'avant-balade, affiché juste après le démarrage. */
  const [showBrief, setShowBrief] = useState(false);

  /** Synchrone et sans setState direct : tout se joue dans les .then —
   *  compatible avec la règle `react-hooks/set-state-in-effect`. */
  const load = useCallback(() => {
    Promise.all([getActiveWalk(), listWishlist()])
      .then(async ([walk, wl]) => {
        setWishlist(wl);
        if (walk) {
          const applications = await listApplications(walk.id);
          setState({ phase: "active", walk, applications });
        } else {
          setState({ phase: "idle" });
        }
      })
      .catch(() => setState({ phase: "idle" }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Préchargement discret du module 3D + du GLB pendant que l'utilisateur
  // contemple la home : le mannequin apparaît instantanément au démarrage
  // de la balade, sans avoir coûté un octet au premier paint.
  useEffect(() => {
    const id = setTimeout(() => {
      import("@/features/mannequin/presentation/BodySilhouette3D");
    }, 2000);
    return () => clearTimeout(id);
  }, []);

  const handleStart = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    try {
      const walk = await startWalk();
      haptic("success");
      setState({ phase: "active", walk, applications: [] });
      setShowBrief(true);
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Impossible d'ouvrir la session",
        "error",
      );
    } finally {
      setStarting(false);
    }
  }, [starting]);

  if (state.phase === "loading") {
    return (
      <div className="flex flex-col gap-5" aria-busy>
        <div className="shimmer-bar h-10 w-2/3 border-2 border-on-background/10" />
        <div
          className="shimmer-bar w-full max-w-[380px] mx-auto border-2 border-on-background/10"
          style={{ aspectRatio: "3 / 4" }}
        />
      </div>
    );
  }

  if (state.phase === "active") {
    return (
      <>
        <ActiveWalk
          walk={state.walk}
          initialApplications={state.applications}
          wishlist={wishlist}
          onEnded={load}
        />
        {showBrief && (
          <WalkBriefOverlay
            wishlist={wishlist}
            onEnter={() => setShowBrief(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ScreenHero
        label="Nouvelle session"
        titleLines={["Balade", "Olfactive"]}
        quote="« Entre en parfumerie, ouvre une session, et laisse ta peau se souvenir pour toi. »"
      />

      <HomeSillage />

      <button
        type="button"
        onClick={handleStart}
        disabled={starting}
        className="press-cta w-full max-w-[380px] mx-auto font-sans font-semibold text-sm tracking-widest uppercase bg-on-background text-background border-2 border-on-background px-6 py-4 shadow-[6px_6px_0px_0px_currentColor] disabled:opacity-60"
      >
        {starting ? "Ouverture…" : "Commencer la balade →"}
      </button>

      {wishlist.length > 0 && (
        <p className="text-center font-mono text-[10px] uppercase tracking-widest opacity-40">
          {wishlist.length} parfum{wishlist.length > 1 ? "s" : ""} en wishlist
          à tester
        </p>
      )}
    </div>
  );
}
