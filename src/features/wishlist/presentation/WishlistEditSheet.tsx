"use client";

import { useRef, useState } from "react";
import { clsx } from "clsx";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { Icon } from "@/shared/ui/Icon";
import { PhotoThumb } from "@/shared/ui/PhotoThumb";
import { SmartNoteField } from "@/shared/ui/SmartNoteField";
import { NOTE_CHIPS } from "@/shared/lib/olfactory-lexicon";
import { uploadPhoto } from "@/shared/lib/supabase/storage";
import {
  WISHLIST_PRIORITY_LABELS,
  WISHLIST_STATUS_LABELS,
  type NewWishlistItem,
  type WishlistItem,
  type WishlistPriority,
  type WishlistStatus,
} from "@/features/wishlist/domain/wishlist-item";

const STATUSES = Object.keys(WISHLIST_STATUS_LABELS) as WishlistStatus[];
const PRIORITIES = Object.keys(WISHLIST_PRIORITY_LABELS) as WishlistPriority[];

type Props = {
  item: WishlistItem | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<NewWishlistItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

/** Segments arrondis (chips) — sélection inversée noir/blanc. */
function Segmented<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: T[];
  labels: Record<T, string>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={clsx(
            "rounded-full border-2 border-on-background px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-150 active:scale-95",
            value === opt
              ? "bg-on-background text-background"
              : "bg-background text-on-background/60 hover:text-on-background",
          )}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}

/**
 * Sheet d'édition d'un parfum : maison, note, priorité, statut, photo
 * (caméra directe), suppression. Sections en cascade `card-section`.
 */
export function WishlistEditSheet({ item, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState("");
  const [house, setHouse] = useState("");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState<WishlistPriority>("medium");
  const [status, setStatus] = useState<WishlistStatus>("to_smell");
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [prevItem, setPrevItem] = useState(item);

  // Ouverture sur un nouvel item → hydrate le formulaire (render-time).
  if (item !== prevItem) {
    setPrevItem(item);
    if (item) {
      setName(item.name);
      setHouse(item.house);
      setNote(item.note);
      setPriority(item.priority);
      setStatus(item.status);
      setPhotoPath(item.photoPath);
    }
  }

  if (!item) return null;

  async function save() {
    if (!item || busy) return;
    setBusy(true);
    try {
      await onSave(item.id, {
        name: name.trim() || item.name,
        house: house.trim(),
        note,
        priority,
        status,
        photoPath,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!item || busy) return;
    setBusy(true);
    try {
      await onDelete(item.id);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const fieldClass =
    "w-full px-4 py-3 bg-background text-on-background border-2 border-on-background font-mono text-sm rounded-none focus:outline-none focus:shadow-[4px_4px_0px_0px_currentColor] placeholder:opacity-40 transition-shadow";
  const labelClass = "font-mono text-xs tracking-widest uppercase opacity-60";

  return (
    <BottomSheet
      open
      onClose={onClose}
      label="Fiche parfum"
      title={item.name}
      stagger
    >
      <div className="card-section flex gap-4 items-start">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Photographier le flacon"
          className="relative group active:scale-95 transition-transform"
        >
          <PhotoThumb path={photoPath} alt={name} className="w-24 h-24" />
          <span className="absolute -bottom-2 -right-2 w-8 h-8 bg-on-background text-background flex items-center justify-center border-2 border-background">
            <Icon name="photo_camera" size={15} />
          </span>
        </button>
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Nom</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Maison</label>
            <input
              value={house}
              onChange={(e) => setHouse(e.target.value)}
              placeholder="Nishane, MFK, Amouage…"
              className={fieldClass}
            />
          </div>
        </div>
      </div>

      <div className="card-section mt-5">
        <SmartNoteField
          value={note}
          onChange={setNote}
          chips={NOTE_CHIPS}
          label="Note personnelle"
          placeholder="Pourquoi ce parfum t'appelle…"
          multiline
        />
      </div>

      <div className="card-section flex flex-col gap-2 mt-5">
        <label className={labelClass}>Statut</label>
        <Segmented
          options={STATUSES}
          labels={WISHLIST_STATUS_LABELS}
          value={status}
          onChange={setStatus}
        />
      </div>

      <div className="card-section flex flex-col gap-2 mt-5">
        <label className={labelClass}>Priorité</label>
        <Segmented
          options={PRIORITIES}
          labels={WISHLIST_PRIORITY_LABELS}
          value={priority}
          onChange={setPriority}
        />
      </div>

      <div className="card-section flex items-center gap-3 mt-7">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="press-cta flex-1 font-sans font-semibold text-sm tracking-widest uppercase bg-on-background text-background border-2 border-on-background px-6 py-3.5 shadow-[4px_4px_0px_0px_currentColor] disabled:opacity-50"
        >
          {busy ? "…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          aria-label="Supprimer"
          className="w-[52px] h-[52px] border-2 border-on-background flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
        >
          <Icon name="delete" size={20} />
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          try {
            setPhotoPath(await uploadPhoto(file));
          } finally {
            setBusy(false);
          }
        }}
      />
    </BottomSheet>
  );
}
