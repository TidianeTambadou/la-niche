"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { getPhotoUrl } from "@/shared/lib/supabase/storage";
import { Icon } from "@/shared/ui/Icon";

type Props = {
  path: string | null;
  alt: string;
  className?: string;
};

/**
 * Vignette photo depuis le bucket privé : résout l'URL signée (cachée),
 * shimmer pendant le chargement, placeholder flacon si absente.
 */
export function PhotoThumb({ path, alt, className }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [prevPath, setPrevPath] = useState(path);

  // Resynchronisation pendant le render (pattern React sanctionné) :
  // un nouveau chemin invalide l'URL signée précédente.
  if (prevPath !== path) {
    setPrevPath(path);
    setUrl(null);
    setLoaded(false);
  }

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    getPhotoUrl(path).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path) {
    return (
      <div
        className={clsx(
          "flex items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant/50",
          className,
        )}
        aria-hidden
      >
        <Icon name="water_drop" size={20} />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl",
        !loaded && "shimmer-bar",
        className,
      )}
    >
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- URL signée éphémère, next/image inadapté
        <img
          src={url}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={clsx(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}
