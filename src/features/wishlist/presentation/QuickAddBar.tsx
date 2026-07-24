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
      <div className="flex-1 flex items-stretch border-2 border-on-background focus-within:shadow-[4px_4px_0px_0px_currentColor] transition-shadow bg-background">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Nom du parfum…"
          aria-label="Nom du parfum"
          className="flex-1 min-w-0 px-4 py-3 bg-transparent font-mono text-sm focus:outline-none placeholder:opacity-40"
        />
        {pendingPhoto && (
          <span className="flex items-center pr-2 text-on-background/60">
            <Icon name="photo_camera" size={16} filled />
          </span>
        )}
      </div>

      <button
        type="button"
        aria-label="Ajouter une photo (galerie ou appareil)"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="w-12 border-2 border-on-background flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
      >
        <Icon name="photo_camera" size={20} />
      </button>

      <button
        type="button"
        aria-label="Ajouter"
        onClick={submit}
        disabled={busy || !name.trim()}
        className="press-cta w-12 bg-on-background text-background border-2 border-on-background shadow-[4px_4px_0px_0px_currentColor] flex items-center justify-center disabled:opacity-40"
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
