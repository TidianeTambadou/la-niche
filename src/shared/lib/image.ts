/**
 * Pipeline photo : recompression côté client avant upload.
 * - Résout le problème HEIC iPhone (le canvas ré-encode en JPEG universel)
 * - Divise le poids par ~10 (indispensable en 4G de boutique)
 * - Normalise l'orientation (le décodage navigateur applique l'EXIF)
 */

const MAX_EDGE = 1400;
const JPEG_QUALITY = 0.82;

export async function compressImage(file: File): Promise<Blob> {
  // createImageBitmap gère HEIC sur Safari, JPEG/PNG/WebP partout.
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    // Format illisible par ce navigateur : on envoie tel quel.
    return file;
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  return blob ?? file;
}

/** UUID sûr même hors contexte sécurisé (http://IP en dev mobile). */
export function safeUUID(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
