"use client";

import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import { Icon } from "@/shared/ui/Icon";
import { createClient } from "@/shared/lib/supabase/client";
import type { Walk } from "@/features/walk/domain/walk";
import type { WishlistItem } from "@/features/wishlist/domain/wishlist-item";
import {
  getActiveWalk,
  listApplications,
  listWalks,
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

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

/** Balades des 7 derniers jours (streak hebdo, max 5 barres). */
function walksThisWeek(walks: Walk[]): number {
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  return walks.filter((w) => new Date(w.startedAt).getTime() >= weekAgo).length;
}

/**
 * Home Club : salutation, carte hero coral qui met la patate, stats +
 * streak, rappel du parfum prioritaire. Le mannequin n'apparaît qu'en
 * session — la home reste ultra-légère.
 */
export function BaladeScreen() {
  const [state, setState] = useState<State>({ phase: "loading" });
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [starting, setStarting] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [firstName, setFirstName] = useState<string>("");
  const [stats, setStats] = useState<{ poses: number; week: number }>({
    poses: 0,
    week: 0,
  });

  /** Synchrone et sans setState direct : tout se joue dans les .then. */
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

    // Stats de la home (non bloquantes).
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      const dn = (user?.user_metadata?.display_name as string | undefined) ?? "";
      setFirstName(dn.split(" ")[0] ?? "");
    });
    listWalks()
      .then(async (walks) => {
        const { count } = await createClient()
          .from("walk_applications")
          .select("id", { count: "exact", head: true });
        setStats({ poses: count ?? 0, week: walksThisWeek(walks) });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Préchargement discret du module 3D + du GLB pendant que l'utilisateur
  // est sur la home : le mannequin apparaît instantanément en session.
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
      <div className="flex flex-col gap-4" aria-busy>
        <div className="shimmer-bar h-8 w-1/2 rounded-full" />
        <div className="shimmer-bar h-52 rounded-[26px]" />
        <div className="grid grid-cols-2 gap-3">
          <div className="shimmer-bar h-28 rounded-[22px]" />
          <div className="shimmer-bar h-28 rounded-[22px]" />
        </div>
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

  const toSmell = wishlist.filter((w) => w.status === "to_smell");
  const topPick = [...toSmell].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  )[0];

  return (
    <div className="flex flex-col gap-4">
      <p className="hero-label text-[15px] font-semibold text-on-surface-variant normal-case tracking-normal">
        Yo{firstName ? " " : ""}
        <b className="text-on-background">{firstName}</b> 👋 prêt à sentir ?
      </p>

      {/* ─── Hero coral ─── */}
      <div className="hero-line-1 relative overflow-hidden rounded-[26px] bg-gradient-to-br from-pop to-pop-strong p-6">
        <span aria-hidden className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/15" />
        <span aria-hidden className="absolute right-10 top-24 w-16 h-16 rounded-full bg-white/10" />
        <h1 className="title-mega text-[44px] text-white">
          Balade
          <br />
          Olfactive
        </h1>
        <p className="mt-2.5 text-[13px] font-semibold text-white/85">
          {toSmell.length > 0
            ? `${toSmell.length} parfum${toSmell.length > 1 ? "s" : ""} t'attend${toSmell.length > 1 ? "ent" : ""} dans ta wishlist`
            : "Ta peau est prête, la boutique t'attend"}
        </p>
        <button
          type="button"
          onClick={handleStart}
          disabled={starting}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[13px] font-extrabold uppercase tracking-wider text-pop-strong active:scale-95 transition-transform disabled:opacity-60"
        >
          {starting ? "Ouverture…" : "Let's go →"}
        </button>
      </div>

      {/* ─── Stats ─── */}
      <div className="hero-line-2 grid grid-cols-2 gap-3">
        <div className="rounded-[22px] bg-surface-container-low p-4">
          <div className="title-mega text-4xl text-pop">{stats.poses}</div>
          <div className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Parfums posés
          </div>
        </div>
        <div className="rounded-[22px] bg-surface-container-low p-4">
          <div className="title-mega text-4xl">
            {stats.week}
            <span className="text-lg">/sem</span>
          </div>
          <div className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Streak balades
          </div>
          <div className="mt-2.5 flex gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={clsx(
                  "h-1.5 flex-1 rounded-full",
                  i < Math.min(stats.week, 5)
                    ? "bg-lime"
                    : "bg-surface-container-highest",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─── Rappel prioritaire ─── */}
      {topPick && (
        <div className="hero-quote flex items-center gap-3.5 rounded-[22px] bg-surface-container-low p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pop-soft text-pop">
            <Icon name="favorite" size={20} filled />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">
              {topPick.name} est toujours là
            </p>
            <p className="truncate text-xs font-medium text-on-surface-variant">
              {topPick.priority === "high" ? "Priorité haute · " : ""}à sentir
              {topPick.house ? ` · ${topPick.house}` : ""}
            </p>
          </div>
          <span className="font-extrabold text-pop">→</span>
        </div>
      )}
    </div>
  );
}
