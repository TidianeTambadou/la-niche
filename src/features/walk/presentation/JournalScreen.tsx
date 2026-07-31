"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ScreenHero } from "@/shared/ui/ScreenHero";
import { TimeTicker } from "@/shared/ui/TimeTicker";
import { Icon } from "@/shared/ui/Icon";
import { BODY_ZONE_LABELS } from "@/features/mannequin/domain/body-zones";
import type { Walk } from "@/features/walk/domain/walk";
import {
  listAllApplications,
  listWalks,
  type ApplicationWithInsights,
} from "@/features/walk/infrastructure/walk-repository";
import { EmptyBottle } from "@/features/wishlist/presentation/EmptyBottle";

function walkDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    })
    .toUpperCase();
}

function walkDuration(walk: Walk): string {
  const end = walk.endedAt ? new Date(walk.endedAt) : new Date();
  const mins = Math.max(
    1,
    Math.round((end.getTime() - new Date(walk.startedAt).getTime()) / 60000),
  );
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, "0")}`;
}

/**
 * Journal : stats du nez (compteurs odomètre) + liste des balades.
 * Chaque carte s'ouvre sur le replay scrubbable.
 */
export function JournalScreen() {
  const [walks, setWalks] = useState<Walk[] | null>(null);
  const [applications, setApplications] = useState<ApplicationWithInsights[]>([]);

  useEffect(() => {
    Promise.all([listWalks(), listAllApplications()])
      .then(([w, a]) => {
        setWalks(w);
        setApplications(a);
      })
      .catch(() => setWalks([]));
  }, []);

  const stats = useMemo(() => {
    const perfumes = new Set(
      applications.map((a) => a.perfumeName.toLowerCase()),
    );
    const houses = new Set(
      applications.map((a) => a.perfumeHouse.toLowerCase()).filter(Boolean),
    );
    const zoneCounts = new Map<string, number>();
    for (const a of applications) {
      zoneCounts.set(a.bodyZone, (zoneCounts.get(a.bodyZone) ?? 0) + 1);
    }
    const favoriteZone =
      [...zoneCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return {
      walks: walks?.length ?? 0,
      perfumes: perfumes.size,
      houses: houses.size,
      favoriteZone,
    };
  }, [walks, applications]);

  const posesByWalk = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of applications) {
      m.set(a.walkId, (m.get(a.walkId) ?? 0) + 1);
    }
    return m;
  }, [applications]);

  return (
    <div className="flex flex-col gap-6">
      <ScreenHero label="Mémoire olfactive" titleLines={["Journal"]} />

      {/* ─── Stats du nez ─── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: stats.walks, label: "Balades" },
          { value: stats.perfumes, label: "Parfums" },
          { value: stats.houses, label: "Maisons" },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-0.5 rounded-[22px] bg-surface-container-low py-4">
            <TimeTicker
              value={String(s.value)}
              className="title-mega text-3xl text-pop tabular-nums"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {stats.favoriteZone && (
        <p className="-mt-2 text-center text-[12px] font-semibold text-on-surface-variant">
          Zone de prédilection :{" "}
          {BODY_ZONE_LABELS[stats.favoriteZone as keyof typeof BODY_ZONE_LABELS]}
        </p>
      )}

      {/* ─── Balades ─── */}
      {walks === null ? (
        <div className="flex flex-col gap-3" aria-busy>
          {[0, 1].map((i) => (
            <div key={i} className="shimmer-bar h-20 rounded-[22px]" />
          ))}
        </div>
      ) : walks.length === 0 ? (
        <EmptyBottle quote="« Ta première balade écrira la première page. »" />
      ) : (
        <ul className="flex flex-col gap-3">
          {walks.map((walk, i) => {
            const poses = posesByWalk.get(walk.id) ?? 0;
            const active = walk.endedAt === null;
            return (
              <li
                key={walk.id}
                className="reveal-fade-in"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <Link
                  href={`/journal/${walk.id}`}
                  className="group flex items-center gap-4 rounded-[22px] bg-surface-container-low p-4 transition-transform duration-150 active:scale-[0.98]"
                >
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-surface-container-high">
                    <span className="text-[10px] font-extrabold uppercase">
                      {walkDate(walk.startedAt).split(" ")[1]}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                      {walkDate(walk.startedAt).split(" ")[2]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[15px] font-extrabold tracking-tight">
                      {walk.title || `Balade du ${walkDate(walk.startedAt).toLowerCase()}`}
                    </p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {poses} pose{poses > 1 ? "s" : ""} · {walkDuration(walk)}
                      {active && (
                        <span className="ml-2 inline-flex items-center gap-1">
                          <span className="live-pulse inline-block w-1.5 h-1.5 rounded-full bg-pop" />
                          En cours
                        </span>
                      )}
                    </p>
                  </div>
                  <Icon
                    name="arrow_forward"
                    size={18}
                    className="opacity-40 group-hover:opacity-100 transition-opacity"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
