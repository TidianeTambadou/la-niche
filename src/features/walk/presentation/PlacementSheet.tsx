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
              className="w-full h-44 object-cover border-2 border-on-background"
            />
            <span className="absolute bottom-2 right-2 px-2.5 py-1 bg-background/95 border border-outline-variant font-mono text-[9px] uppercase tracking-widest flex items-center gap-1.5">
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
              className="press-cta w-full h-24 bg-on-background text-background border-2 border-on-background shadow-[4px_4px_0px_0px_currentColor] flex flex-col items-center justify-center gap-1.5"
            >
              <Icon name="photo_camera" size={26} />
              <span className="font-sans font-semibold text-xs tracking-widest uppercase">
                Photographier le flacon
              </span>
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="self-center font-mono text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 underline-offset-4 hover:underline inline-flex items-center gap-1.5"
            >
              <Icon name="photo_library" size={13} />
              Choisir dans la photothèque
            </button>
          </div>
        )}
      </div>

      {/* 2. LE PARFUM — pré-rempli, recherché ou saisi. */}
      <div className="card-section mt-5">
        {activePerfume ? (
          <div className="flex items-center justify-between border-2 border-on-background px-4 py-3">
            <div className="min-w-0">
              <p className="font-sans font-bold text-sm truncate">
                {activePerfume.name}
              </p>
              {activePerfume.house && (
                <p className="font-cormorant italic text-sm opacity-60 truncate">
                  {activePerfume.house}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setQuery("");
              }}
              aria-label="Changer de parfum"
              className="shrink-0 w-8 h-8 border-2 border-on-background flex items-center justify-center active:scale-95 transition-transform"
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs tracking-widest uppercase opacity-60">
              Quel parfum ?
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Recherche wishlist ou saisie libre…"
              className="w-full px-4 py-3 bg-background text-on-background border-2 border-on-background font-mono text-sm rounded-none focus:outline-none focus:shadow-[4px_4px_0px_0px_currentColor] placeholder:opacity-40 transition-shadow"
            />
            {suggestions.length > 0 && (
              <ul className="border-2 border-on-background divide-y-2 divide-on-background">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-on-background hover:text-background transition-colors flex items-baseline justify-between gap-3"
                    >
                      <span className="font-sans font-bold text-sm truncate">
                        {s.name}
                      </span>
                      {s.house && (
                        <span className="font-mono text-[10px] uppercase tracking-widest opacity-60 shrink-0">
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
            "press-cta w-full font-sans font-semibold text-sm tracking-widest uppercase border-2 border-on-background px-6 py-4",
            "bg-on-background text-background shadow-[4px_4px_0px_0px_currentColor]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          {busy ? "Enregistrement…" : "Poser le parfum ici →"}
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
