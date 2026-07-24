"use client";

import { useEffect, useMemo, useState } from "react";
import { ScreenHero } from "@/shared/ui/ScreenHero";
import { Icon } from "@/shared/ui/Icon";
import { createClient } from "@/shared/lib/supabase/client";
import { signOut } from "@/features/auth/application/actions";
import {
  LazyBodySilhouette3D,
  type PlacedMarker,
} from "@/features/mannequin/presentation/LazyBodySilhouette3D";
import {
  BODY_ZONE_LABELS,
  type BodyZone,
} from "@/features/mannequin/domain/body-zones";
import {
  listAllApplications,
  type ApplicationWithInsights,
} from "@/features/walk/infrastructure/walk-repository";

/**
 * Profil : identité, cartographie de la peau (heatmap des zones —
 * toutes balades confondues) et déconnexion.
 */
export function ProfileScreen() {
  const [email, setEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [applications, setApplications] = useState<ApplicationWithInsights[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? "");
      setDisplayName(
        (user?.user_metadata?.display_name as string | undefined) ?? "",
      );
    });
    listAllApplications().then(setApplications).catch(() => {});
  }, []);

  /** Heatmap : un marqueur par zone, ×N — la densité de ta pratique. */
  const heatmap = useMemo<PlacedMarker[]>(() => {
    const byZone = new Map<BodyZone, ApplicationWithInsights[]>();
    for (const app of applications) {
      const list = byZone.get(app.bodyZone) ?? [];
      list.push(app);
      byZone.set(app.bodyZone, list);
    }
    return Array.from(byZone.entries()).map(([zone, apps]) => ({
      fragranceId: zone,
      zone,
      label: `×${apps.length}`,
      position: apps[apps.length - 1]!.position ?? undefined,
    }));
  }, [applications]);

  const topZones = useMemo(() => {
    const counts = new Map<BodyZone, number>();
    for (const a of applications) {
      counts.set(a.bodyZone, (counts.get(a.bodyZone) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [applications]);

  return (
    <div className="flex flex-col gap-6">
      <ScreenHero
        label={email || "Profil"}
        titleLines={[displayName || "Ton nez"]}
      />

      {applications.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-mono text-xs uppercase tracking-widest opacity-60">
              Cartographie de ta peau
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">
              {applications.length} pose{applications.length > 1 ? "s" : ""}
            </span>
          </div>
          <LazyBodySilhouette3D readOnly filledMarkers={heatmap} />
          {topZones.length > 0 && (
            <ol className="flex flex-col gap-1.5">
              {topZones.map(([zone, count], i) => (
                <li
                  key={zone}
                  className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest"
                >
                  <span className="opacity-40">0{i + 1}</span>
                  <span className="flex-1">{BODY_ZONE_LABELS[zone]}</span>
                  <span className="font-bold">×{count}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <form action={signOut}>
        <button
          type="submit"
          className="w-full font-sans font-semibold text-sm tracking-widest uppercase bg-background text-on-background border-2 border-on-background px-6 py-3.5 hover:bg-on-background hover:text-background transition-colors inline-flex items-center justify-center gap-2"
        >
          <Icon name="logout" size={17} />
          Se déconnecter
        </button>
      </form>

      <p className="text-center font-mono text-[9px] uppercase tracking-widest opacity-30">
        LA NICHE · V0.1 · CARNET OLFACTIF
      </p>
    </div>
  );
}
