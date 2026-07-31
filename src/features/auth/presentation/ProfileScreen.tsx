"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ScreenHero } from "@/shared/ui/ScreenHero";
import { SectionLabel } from "@/shared/ui/brutalist/SectionLabel";
import { Icon } from "@/shared/ui/Icon";
import { createClient } from "@/shared/lib/supabase/client";
import { signOut } from "@/features/auth/application/actions";
import { MannequinSettingsPanel } from "@/features/mannequin/presentation/MannequinSettingsPanel";
import {
  BODY_ZONE_LABELS,
  type BodyZone,
} from "@/features/mannequin/domain/body-zones";
import {
  listAllApplications,
  type ApplicationWithInsights,
} from "@/features/walk/infrastructure/walk-repository";

/**
 * Profil : identité, réglages de fluidité du mannequin, zones de
 * prédilection (texte) et déconnexion. Aucun canvas 3D ici — léger.
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

  const topZones = useMemo(() => {
    const counts = new Map<BodyZone, number>();
    for (const a of applications) {
      counts.set(a.bodyZone, (counts.get(a.bodyZone) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [applications]);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-start justify-between gap-4">
        <ScreenHero
          label={email || "Profil"}
          titleLines={[displayName || "Ton nez"]}
        />
        <Link
          href="/"
          aria-label="Retour"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-low active:scale-95 transition-transform"
        >
          <Icon name="arrow_back" size={17} />
        </Link>
      </div>

      {/* ─── Fluidité du mannequin ─── */}
      <section className="flex flex-col gap-4 rounded-[26px] bg-surface-container-low p-5">
        <SectionLabel>Fluidité du mannequin</SectionLabel>
        <MannequinSettingsPanel />
      </section>

      {/* ─── Zones de prédilection ─── */}
      {topZones.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionLabel>
            Zones de prédilection — {applications.length} pose
            {applications.length > 1 ? "s" : ""}
          </SectionLabel>
          <ol className="flex flex-col gap-1.5">
            {topZones.map(([zone, count], i) => (
              <li
                key={zone}
                className="flex items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-[12px] font-bold uppercase tracking-wider"
              >
                <span className="text-pop">0{i + 1}</span>
                <span className="flex-1">{BODY_ZONE_LABELS[zone]}</span>
                <span className="font-bold">×{count}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <form action={signOut}>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-surface-container-low px-6 py-4 text-[13px] font-extrabold uppercase tracking-wider text-pop active:scale-95 transition-transform"
        >
          <Icon name="logout" size={17} />
          Se déconnecter
        </button>
      </form>

      <p className="text-center text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/50">
        LA NICHE · V0.2 · CARNET OLFACTIF
      </p>
    </div>
  );
}
