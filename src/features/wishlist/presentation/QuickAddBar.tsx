"use client";

import { useRef, useState } from "react";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/Toaster";
import { uploadPhoto } from "@/shared/lib/supabase/storage";

type Props = {
  /** Ajout : nom obligatoire, photo optionnelle (déjà uploadée → path). */
  onAdd: (name: string, photoPath: string | null) => Promise<void>;
};

/**
 * Barre d'ajout ultra-rapide : UN champ + entrée = parfum créé.
 * Le bouton appareil photo ouvre directement la caméra arrière
 * (`capture="environment"`) pour shooter le flacon en boutique —
 * ajout photo-first, nom complété après si besoin.
 */
export function QuickAddBar({ onAdd }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onAdd(trimmed, pendingPhoto);
      setName("");
      setPendingPhoto(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec de l'ajout", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const path = await uploadPhoto(file);
      setPendingPhoto(path);
      // Photo-first : si aucun nom saisi, on crée direct un brouillon nommé
      // "Flacon à identifier" — zéro friction en boutique.
      if (!name.trim()) {
        await onAdd("Flacon à identifier", path);
        setPendingPhoto(null);
        toast("Flacon ajouté — nomme-le quand tu veux", "success");
      } else {
        toast("Photo prête", "success");
      }
    } catch (e) {
      toast(
        e instanceof Error ? e.message : "Échec de l'envoi de la photo",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-stretch gap-2">
      <div className="flex flex-1 items-stretch rounded-2xl bg-surface-container-low focus-within:ring-2 focus-within:ring-pop transition-shadow">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Nom du parfum…"
          aria-label="Nom du parfum"
          className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm font-semibold focus:outline-none placeholder:text-on-surface-variant/50"
        />
        {pendingPhoto && (
          <span className="flex items-center pr-3 text-lime">
            <Icon name="photo_camera" size={16} filled />
          </span>
        )}
      </div>

      <button
        type="button"
        aria-label="Ajouter une photo (galerie ou appareil)"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="flex w-12 items-center justify-center rounded-2xl bg-surface-container-low active:scale-95 transition-transform disabled:opacity-50"
      >
        <Icon name="photo_camera" size={20} />
      </button>

      <button
        type="button"
        aria-label="Ajouter"
        onClick={submit}
        disabled={busy || !name.trim()}
        className="flex w-12 items-center justify-center rounded-2xl bg-pop text-on-pop active:scale-95 transition-transform disabled:opacity-40"
      >
        {busy ? (
          <Icon name="progress_activity" size={20} className="refresh-spinning" />
        ) : (
          <Icon name="add" size={22} />
        )}
      </button>

      {/* Sans `capture` : iOS propose Photothèque OU Appareil photo. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handlePhoto(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
