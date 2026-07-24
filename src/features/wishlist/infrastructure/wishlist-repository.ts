import { createClient } from "@/shared/lib/supabase/client";
import type {
  NewWishlistItem,
  WishlistItem,
  WishlistPriority,
  WishlistStatus,
} from "@/features/wishlist/domain/wishlist-item";

/** Ligne brute Postgres (snake_case). */
type WishlistRow = {
  id: string;
  user_id: string;
  name: string;
  house: string;
  photo_path: string | null;
  note: string;
  priority: WishlistPriority;
  status: WishlistStatus;
  created_at: string;
  updated_at: string;
};

function mapRow(row: WishlistRow): WishlistItem {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    house: row.house,
    photoPath: row.photo_path,
    note: row.note,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listWishlist(): Promise<WishlistItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as WishlistRow[]).map(mapRow);
}

export async function addWishlistItem(
  input: NewWishlistItem,
): Promise<WishlistItem> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const { data, error } = await supabase
    .from("wishlist_items")
    .insert({
      user_id: user.id,
      name: input.name,
      house: input.house ?? "",
      note: input.note ?? "",
      priority: input.priority ?? "medium",
      status: input.status ?? "to_smell",
      photo_path: input.photoPath ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as WishlistRow);
}

export async function updateWishlistItem(
  id: string,
  patch: Partial<NewWishlistItem>,
): Promise<WishlistItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .update({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.house !== undefined && { house: patch.house }),
      ...(patch.note !== undefined && { note: patch.note }),
      ...(patch.priority !== undefined && { priority: patch.priority }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.photoPath !== undefined && { photo_path: patch.photoPath }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as WishlistRow);
}

export async function deleteWishlistItem(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("wishlist_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
