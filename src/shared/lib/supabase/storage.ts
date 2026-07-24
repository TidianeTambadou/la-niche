import { createClient } from "@/shared/lib/supabase/client";
import { compressImage, safeUUID } from "@/shared/lib/image";

const BUCKET = "photos";

/**
 * Upload d'une photo de flacon dans le bucket privé `photos`.
 * La photo est recompressée en JPEG (HEIC iPhone inclus) avant envoi.
 * Convention : {userId}/{uuid}.jpg — imposée par les policies RLS.
 * Retourne le chemin à stocker en base.
 */
export async function uploadPhoto(file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const blob = await compressImage(file);
  const path = `${user.id}/${safeUUID()}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(`Upload impossible : ${error.message}`);

  return path;
}

/** Cache mémoire des URLs signées (le bucket est privé). */
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * URL signée (1 h) pour afficher une photo. Mise en cache par session
 * pour éviter un aller-retour réseau à chaque render.
 */
export async function getPhotoUrl(path: string): Promise<string | null> {
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.url;
  }

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);
  if (error || !data) return null;

  signedUrlCache.set(path, {
    url: data.signedUrl,
    expiresAt: Date.now() + 3600_000,
  });
  return data.signedUrl;
}
