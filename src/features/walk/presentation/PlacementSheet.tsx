"use client";

import { useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { Icon } from "@/shared/ui/Icon";
import { SmartNoteField } from "@/shared/ui/SmartNoteField";
import { toast } from "@/shared/ui/Toaster";
import { NOTE_CHIPS } from "@/shared/lib/olfactory-lexicon";
import { uploadPhoto } from "@/shared/lib/supabase/storage";
import {
  BODY_ZONE_LABELS,
  type BodyZone,
} from "@/features/mannequin/domain/body-zones";
import { upcomingColor } from "@/features/mannequin/domain/palette";
import type { WishlistItem } from "@/features/wishlist/domain/wishlist-item";

export type PlacementDraft = {
  zone: BodyZone;
  position: [number, number, number];
};

export type PlacementResult = {
  perfumeName: string;
  perfumeHouse: string;
  wishlistItemId: string | null;
  photoPath: string | null;
  note: string;
  /** Pour le vol de la photo vers le marqueur (FLIP). */
  flyFrom: DOMRect | null;
  previewUrl: string | null;
};

type Props = {
  draft: PlacementDraft | null;
  wishlist: WishlistItem[];
  /** Parfum pré-sélectionné depuis le rail wishlist. */
  preselected: WishlistItem | null;
  /** Couleurs déjà attribuées dans la session (palette olfactive). */
  sessionColors: Map<string, string>;
  onClose: () => void;
  onConfirm: (result: PlacementResult) => Promise<void>;
};

/**
 * Sheet de pose — caméra-first : le geste central en boutique est
 * PHOTOGRAPHIER le flacon. Gros bouton capture (ouvre l'appareil photo
 * arrière), parfum pré-rempli via le rail wishlist ou recherche/saisie
 * libre, note optionnelle. La photo confirmée s'envole vers le marqueur.
 */
export function PlacementSheet({
  draft,
  wishlist,
  preselected,
  sessionColors,
  onClose,
  onConfirm,
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<WishlistItem | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLImageElement>(null);

  const activePerfume = selected ?? preselected;
  const freeName = query.trim();

  const suggestions = useMemo(() => {
    if (!freeName || activePerfume) return [];
    const q = freeName.toLowerCase();
    return wishlist
      .filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.house.toLowerCase().includes(q),
      )
      .slice(0, 4);
  }, [freeName, activePerfume, wishlist]);

  if (!draft) return null;

  const canConfirm =
    !busy && !uploading && (activePerfume !== null || freeName.length > 0);

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    // Preview locale immédiate — l'upload suit en parallèle du geste.
    setPreviewUrl(URL.createObjectURL(file));
    try {
      setPhotoPath(await uploadPhoto(file));
    } catch (e) {
      setPreviewUrl(null);
      toast(
        e instanceof Error ? e.message : "Échec de l'envoi de la photo",
        "error",
      );
    } finally {
      setUploading(false);
    }
  }

  async function confirm() {
    if (!canConfirm) return;
    setBusy(true);
    try {
      await onConfirm({
        perfumeName: activePerfume ? activePerfume.name : freeName,
        perfumeHouse: activePerfume?.house ?? "",
        wishlistItemId: activePerfume?.id ?? null,
        photoPath,
        note: note.trim(),
        flyFrom: previewRef.current?.getBoundingClientRect() ?? null,
        previewUrl,
      });
      // Reset pour la pose suivante.
      setQuery("");
      setSelected(null);
      setPhotoPath(null);
      setPreviewUrl(null);
      setNote("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet
      open
      onClose={onClose}
      label="Nouvelle pose"
      title={BODY_ZONE_LABELS[draft.zone]}
      stagger
    >
      {/* 1. LA PHOTO — le geste boutique. Plein cadre, caméra directe. */}
      <div className="card-section">
        {previewUrl ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-full active:scale-[0.99] transition-transform"
            aria-label="Reprendre la photo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- preview locale ObjectURL */}
            <img
              ref={previewRef}
              src={previewUrl}
              alt="Flacon photographié"
              className="h-44 w-full rounded-[22px] object-cover"
            />
            <span className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur">
              {uploading ? (
                <>
                  <Icon name="progress_activity" size={11} className="refresh-spinning" />
                  Envoi…
                </>
              ) : (
                <>
                  <Icon name="photo_camera" size={11} />
                  Reprendre
                </>
              )}
            </span>
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-[22px] bg-pop text-on-pop active:scale-[0.98] transition-transform"
            >
              <Icon name="photo_camera" size={26} />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Shoote le flacon
              </span>
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="inline-flex items-center gap-1.5 self-center text-[11px] font-bold text-on-surface-variant hover:text-on-background transition-colors"
            >
              <Icon name="photo_library" size={14} />
              Choisir dans la photothèque
            </button>
          </div>
        )}
      </div>

      {/* 2. LE PARFUM — pré-rempli, recherché ou saisi. */}
      <div className="card-section mt-5">
        {activePerfume ? (
          <div className="flex items-center justify-between rounded-2xl bg-surface-container-high px-4 py-3">
            <div className="min-w-0 flex items-center gap-2.5">
              {/* La couleur que ce parfum portera sur le mannequin. */}
              <span
                aria-hidden
                className="w-3.5 h-3.5 rounded-full shrink-0 select-pop"
                style={{
                  backgroundColor: upcomingColor(
                    sessionColors,
                    activePerfume.name,
                  ),
                }}
              />
              <div className="min-w-0">
              <p className="font-sans font-bold text-sm truncate">
                {activePerfume.name}
              </p>
              {activePerfume.house && (
                <p className="truncate text-xs font-medium text-on-surface-variant">
                  {activePerfume.house}
                </p>
              )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setQuery("");
              }}
              aria-label="Changer de parfum"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-highest active:scale-95 transition-transform"
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">
              Quel parfum ?
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Recherche wishlist ou saisie libre…"
              className="w-full rounded-2xl bg-surface-container-high px-4 py-3.5 text-sm font-semibold placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-pop transition-shadow"
            />
            {freeName && suggestions.length === 0 && (
              <span className="bubble-in inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Sa couleur sur le corps
                <span
                  aria-hidden
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: upcomingColor(sessionColors, freeName),
                  }}
                />
              </span>
            )}
            {suggestions.length > 0 && (
              <ul className="overflow-hidden rounded-2xl bg-surface-container-high divide-y divide-surface-container-highest">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(s)}
                      className="flex w-full items-baseline justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container-highest"
                    >
                      <span className="truncate text-sm font-bold">
                        {s.name}
                      </span>
                      {s.house && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                          {s.house}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 3. NOTE — assistée par le lexique, jamais bloquante. */}
      <div className="card-section mt-5">
        <SmartNoteField
          value={note}
          onChange={setNote}
          chips={NOTE_CHIPS}
          placeholder="Première impression… (optionnel)"
        />
      </div>

      <div className="card-section mt-6">
        <button
          type="button"
          onClick={confirm}
          disabled={!canConfirm}
          className={clsx(
            "w-full rounded-full bg-on-background px-6 py-4 text-[13px] font-extrabold uppercase tracking-wider text-on-primary",
            "active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          {busy ? "Enregistrement…" : "Pose-le →"}
        </button>
      </div>

      {/* Caméra directe (geste boutique) */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handlePhoto(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {/* Photothèque (photo déjà prise) */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handlePhoto(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </BottomSheet>
  );
}
