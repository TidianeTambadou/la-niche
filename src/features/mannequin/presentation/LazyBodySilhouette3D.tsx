"use client";

import dynamic from "next/dynamic";

/**
 * Chargement paresseux du canvas 3D (three + R3F restent hors du bundle
 * initial). Fallback : silhouette shimmer au même ratio pour éviter tout
 * saut de layout.
 */
export const LazyBodySilhouette3D = dynamic(
  () =>
    import("./BodySilhouette3D").then((m) => ({
      default: m.BodySilhouette3D,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="shimmer-bar relative mx-auto w-full max-w-[380px] rounded-[26px]"
        style={{ aspectRatio: "3 / 4" }}
        aria-busy
      />
    ),
  },
);

export type { PlacedMarker } from "./BodySilhouette3D";
