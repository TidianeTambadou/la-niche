"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { ScreenHero } from "@/shared/ui/ScreenHero";
import { SectionLabel } from "@/shared/ui/brutalist/SectionLabel";
import type {
  NewWishlistItem,
  WishlistItem,
  WishlistStatus,
} from "@/features/wishlist/domain/wishlist-item";
import { WISHLIST_STATUS_LABELS } from "@/features/wishlist/domain/wishlist-item";
import {
  addWishlistItem,
  deleteWishlistItem,
  listWishlist,
  updateWishlistItem,
} from "@/features/wishlist/infrastructure/wishlist-repository";
import { QuickAddBar } from "./QuickAddBar";
import { WishlistCard } from "./WishlistCard";
import { WishlistEditSheet } from "./WishlistEditSheet";
import { EmptyBottle } from "./EmptyBottle";

type Filter = "all" | WishlistStatus;

/** Ordre de lecture : le programme de la prochaine balade d'abord. */
const GROUP_ORDER: WishlistStatus[] = ["to_smell", "to_compare", "to_buy"];

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Tous" },
  ...(Object.keys(WISHLIST_STATUS_LABELS) as WishlistStatus[]).map((s) => ({
    value: s as Filter,
    label: WISHLIST_STATUS_LABELS[s],
  })),
];

/**
 * Écran Wishlist : ajout 1-champ (ou photo-first), filtres chips,
 * cartes swipe-to-status, édition en bottom sheet. Optimistic UI
 * partout — le réseau ne bloque jamais le geste.
 */
export function WishlistScreen() {
  const [items, setItems] = useState<WishlistItem[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<WishlistItem | null>(null);

  useEffect(() => {
    listWishlist().then(setItems).catch(() => setItems([]));
  }, []);

  const visible = useMemo(() => {
    if (!items) return null;
    if (filter === "all") return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  const handleAdd = useCallback(async (name: string, photoPath: string | null) => {
    const created = await addWishlistItem({ name, photoPath });
    setItems((prev) => [created, ...(prev ?? [])]);
  }, []);

  const handleCycleStatus = useCallback(
    (item: WishlistItem, next: WishlistStatus) => {
      // Optimistic : le stamp claque immédiatement, le réseau suit.
      setItems((prev) =>
        (prev ?? []).map((i) =>
          i.id === item.id ? { ...i, status: next } : i,
        ),
      );
      updateWishlistItem(item.id, { status: next }).catch(() => {
        setItems((prev) =>
          (prev ?? []).map((i) =>
            i.id === item.id ? { ...i, status: item.status } : i,
          ),
        );
      });
    },
    [],
  );

  const handleSave = useCallback(
    async (id: string, patch: Partial<NewWishlistItem>) => {
      const updated = await updateWishlistItem(id, patch);
      setItems((prev) =>
        (prev ?? []).map((i) => (i.id === id ? updated : i)),
      );
    },
    [],
  );

  const handleDelete = useCallback(async (id: string) => {
    await deleteWishlistItem(id);
    setItems((prev) => (prev ?? []).filter((i) => i.id !== id));
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <ScreenHero
        label={
          items && items.length > 0
            ? `${items.length} référence${items.length > 1 ? "s" : ""}`
            : "Carnet d'envies"
        }
        titleLines={["Wishlist"]}
      />

      <QuickAddBar onAdd={handleAdd} />

      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-5 px-5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={clsx(
              "shrink-0 rounded-full border-2 border-on-background px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all duration-150 active:scale-95",
              filter === f.value
                ? "bg-on-background text-background"
                : "bg-background text-on-background/60",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible === null ? (
        <div className="flex flex-col gap-3" aria-busy>
          {[0, 1, 2].map((i) => (
            <div key={i} className="shimmer-bar h-[104px] border-2 border-on-background/10" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyBottle
          quote={
            filter === "all"
              ? "« Le premier parfum que tu noteras ici ne t'échappera plus jamais. »"
              : "« Rien dans cette catégorie, pour l'instant. »"
          }
        />
      ) : filter === "all" ? (
        // Vue "Tous" : sections par statut — la wishlist se lit comme un
        // programme (à sentir d'abord, puis à acheter, puis à comparer).
        <div className="flex flex-col gap-7">
          {GROUP_ORDER.map((status) => {
            const group = visible.filter((i) => i.status === status);
            if (group.length === 0) return null;
            return (
              <section key={status} className="flex flex-col gap-3">
                <SectionLabel>
                  {WISHLIST_STATUS_LABELS[status]} — {group.length}
                </SectionLabel>
                <ul className="flex flex-col gap-3">
                  {group.map((item, i) => (
                    <li
                      key={item.id}
                      className="reveal-fade-in"
                      style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                    >
                      <WishlistCard
                        item={item}
                        onOpen={setEditing}
                        onCycleStatus={handleCycleStatus}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((item, i) => (
            <li
              key={item.id}
              className="reveal-fade-in"
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              <WishlistCard
                item={item}
                onOpen={setEditing}
                onCycleStatus={handleCycleStatus}
              />
            </li>
          ))}
        </ul>
      )}

      <WishlistEditSheet
        item={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
