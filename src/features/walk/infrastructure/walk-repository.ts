import { createClient } from "@/shared/lib/supabase/client";
import type { BodyZone } from "@/features/mannequin/domain/body-zones";
import type {
  NewWalkApplication,
  Walk,
  WalkApplication,
} from "@/features/walk/domain/walk";

/** Impression horodatée du drydown. */
export type Impression = { at: string; text: string };
export type Verdict = "loved" | "maybe" | "no";

type WalkRow = {
  id: string;
  user_id: string;
  title: string;
  location: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
};

type ApplicationRow = {
  id: string;
  walk_id: string;
  user_id: string;
  wishlist_item_id: string | null;
  perfume_name: string;
  perfume_house: string;
  body_zone: string;
  position_x: number | null;
  position_y: number | null;
  position_z: number | null;
  photo_path: string | null;
  note: string;
  applied_at: string;
  verdict: Verdict | null;
  impressions: Impression[];
};

function mapWalk(row: WalkRow): Walk {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    location: row.location,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
  };
}

/** Pose enrichie des colonnes 002 (verdict + impressions). */
export type ApplicationWithInsights = WalkApplication & {
  verdict: Verdict | null;
  impressions: Impression[];
};

function mapApplication(row: ApplicationRow): ApplicationWithInsights {
  return {
    id: row.id,
    walkId: row.walk_id,
    userId: row.user_id,
    wishlistItemId: row.wishlist_item_id,
    perfumeName: row.perfume_name,
    perfumeHouse: row.perfume_house,
    bodyZone: row.body_zone as BodyZone,
    position:
      row.position_x !== null &&
      row.position_y !== null &&
      row.position_z !== null
        ? [row.position_x, row.position_y, row.position_z]
        : null,
    photoPath: row.photo_path,
    note: row.note,
    appliedAt: row.applied_at,
    verdict: row.verdict,
    impressions: row.impressions ?? [],
  };
}

// ─── Balades ─────────────────────────────────────────────────────────────

export async function getActiveWalk(): Promise<Walk | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("walks")
    .select("*")
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapWalk(data as WalkRow) : null;
}

export async function startWalk(): Promise<Walk> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const { data, error } = await supabase
    .from("walks")
    .insert({ user_id: user.id })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapWalk(data as WalkRow);
}

export async function endWalk(id: string): Promise<Walk> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("walks")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapWalk(data as WalkRow);
}

export async function updateWalk(
  id: string,
  patch: { title?: string; location?: string },
): Promise<Walk> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("walks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapWalk(data as WalkRow);
}

export async function listWalks(): Promise<Walk[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("walks")
    .select("*")
    .order("started_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as WalkRow[]).map(mapWalk);
}

/** Supprime la balade ET ses poses (cascade FK). */
export async function deleteWalk(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("walks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getWalk(id: string): Promise<Walk | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("walks")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapWalk(data as WalkRow) : null;
}

// ─── Poses ───────────────────────────────────────────────────────────────

export async function listApplications(
  walkId: string,
): Promise<ApplicationWithInsights[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("walk_applications")
    .select("*")
    .eq("walk_id", walkId)
    .order("applied_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ApplicationRow[]).map(mapApplication);
}

/** Toutes les poses de l'utilisateur (heatmap corporelle, stats). */
export async function listAllApplications(): Promise<
  ApplicationWithInsights[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("walk_applications")
    .select("*")
    .order("applied_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ApplicationRow[]).map(mapApplication);
}

export async function addApplication(
  input: NewWalkApplication,
): Promise<ApplicationWithInsights> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const { data, error } = await supabase
    .from("walk_applications")
    .insert({
      walk_id: input.walkId,
      user_id: user.id,
      wishlist_item_id: input.wishlistItemId ?? null,
      perfume_name: input.perfumeName,
      perfume_house: input.perfumeHouse ?? "",
      body_zone: input.bodyZone,
      position_x: input.position?.[0] ?? null,
      position_y: input.position?.[1] ?? null,
      position_z: input.position?.[2] ?? null,
      photo_path: input.photoPath ?? null,
      note: input.note ?? "",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapApplication(data as ApplicationRow);
}

/** Supprime une pose (et sa photo, en best-effort). */
export async function deleteApplication(
  id: string,
  photoPath?: string | null,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("walk_applications")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  if (photoPath) {
    // Nettoyage silencieux : une photo orpheline n'est pas bloquante.
    supabase.storage.from("photos").remove([photoPath]).then(() => {});
  }
}

export async function setVerdict(
  applicationId: string,
  verdict: Verdict | null,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("walk_applications")
    .update({ verdict })
    .eq("id", applicationId);
  if (error) throw new Error(error.message);
}

export async function addImpression(
  applicationId: string,
  current: Impression[],
  text: string,
): Promise<Impression[]> {
  const supabase = createClient();
  const next = [...current, { at: new Date().toISOString(), text }];
  const { error } = await supabase
    .from("walk_applications")
    .update({ impressions: next })
    .eq("id", applicationId);
  if (error) throw new Error(error.message);
  return next;
}
