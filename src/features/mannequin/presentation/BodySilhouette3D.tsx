"use client";

/**
 * Mannequin 3D — placement "touche n'importe où" + points de zones guidés.
 *
 * Modèle d'interaction :
 *  - 15 points par défaut matérialisent les zones où poser un parfum
 *    (poignets, cou, derrière l'oreille…). Tap sur un point = sélection
 *    directe. Tap libre sur le corps = raycast précis + classification
 *    vers la zone la plus proche. Les deux flux coexistent.
 *  - La caméra dolly sur le point touché ; un marqueur preview pulse à
 *    l'endroit exact avant confirmation.
 *  - Couleur : chaque parfum de la session a sa teinte (palette olfactive).
 *    Une zone multi-parfums devient une pile d'anneaux concentriques
 *    colorés (layering) avec pop d'empilement.
 *
 * Fluidité :
 *  - `frameloop="demand"` + bake d'ombre one-shot.
 *  - Réglages utilisateur (qualité/vitesses) via le store mannequin.
 *  - Tier auto : PerformanceMonitor ajuste la résolution en continu.
 *  - Tier éco : pas d'ombres, marqueurs/points statiques (zéro rendu
 *    hors gestes).
 */

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  CameraControls,
  Html,
  PerformanceMonitor,
  useGLTF,
} from "@react-three/drei";
import CameraControlsImpl from "camera-controls";
import * as THREE from "three";
import { clsx } from "clsx";
import { useTheme } from "next-themes";
import { Icon } from "@/shared/ui/Icon";
import type { BodyZone } from "@/features/mannequin/domain/body-zones";
import {
  ROTATE_SPEED_VALUES,
  ZOOM_SPEED_VALUES,
  resolveProfile,
  useMannequinSettings,
} from "@/features/mannequin/domain/settings";

const MODEL_URL = "/models/mannequin.glb";
const TARGET_HEIGHT = 1.85;

/* -------------------------------------------------------------------------
 * Zone anchors — points par défaut, classification des taps libres et
 * positions de secours pour les données legacy.
 * --------------------------------------------------------------------- */

const ZONE_ANCHORS: Record<BodyZone, THREE.Vector3> = {
  "behind-ear-left": new THREE.Vector3(-0.11, 1.73, -0.02),
  "behind-ear-right": new THREE.Vector3(0.11, 1.73, -0.02),
  "neck-left": new THREE.Vector3(-0.06, 1.55, 0.05),
  "neck-right": new THREE.Vector3(0.06, 1.55, 0.05),
  throat: new THREE.Vector3(0, 1.5, 0.1),
  nape: new THREE.Vector3(0, 1.62, -0.06),
  chest: new THREE.Vector3(0, 1.32, 0.13),
  "inner-elbow-left": new THREE.Vector3(-0.45, 1.5, 0.05),
  "inner-elbow-right": new THREE.Vector3(0.45, 1.5, 0.05),
  "outer-elbow-left": new THREE.Vector3(-0.45, 1.5, -0.05),
  "outer-elbow-right": new THREE.Vector3(0.45, 1.5, -0.05),
  "wrist-left": new THREE.Vector3(-0.78, 1.5, 0.04),
  "wrist-right": new THREE.Vector3(0.78, 1.5, 0.04),
  "back-of-hand-left": new THREE.Vector3(-0.92, 1.52, -0.04),
  "back-of-hand-right": new THREE.Vector3(0.92, 1.52, -0.04),
};

const ALL_ZONES = Object.keys(ZONE_ANCHORS) as BodyZone[];

function closestZone(worldPoint: THREE.Vector3): BodyZone {
  let bestZone: BodyZone = ALL_ZONES[0];
  let bestDist = Infinity;
  for (const zone of ALL_ZONES) {
    const d = ZONE_ANCHORS[zone].distanceToSquared(worldPoint);
    if (d < bestDist) {
      bestDist = d;
      bestZone = zone;
    }
  }
  return bestZone;
}

/* -------------------------------------------------------------------------
 * Public prop types
 * --------------------------------------------------------------------- */

export type PlacedMarker = {
  fragranceId: string;
  zone: BodyZone;
  label: string; // perfume initials or ×N
  position?: [number, number, number];
  /** Couleur du (dernier) parfum posé — palette olfactive. */
  color?: string;
  /** Couleurs de la pile (layering), du plus ancien au plus récent.
   *  Longueur > 1 → anneaux concentriques. */
  stack?: string[];
  /** When true, this marker is rendered greyed-out — used in placement mode
   *  to signal "this zone is already taken; tapping = layering". */
  dimmed?: boolean;
};

type Props = {
  /** Placements to render as solid markers on the body. */
  filledMarkers?: PlacedMarker[];
  /** Zone currently being edited (e.g. just-placed) — pulses. */
  highlightedZone?: BodyZone | null;
  /** Called when user clicks a point on the body mesh. */
  onBodyClick?: (zone: BodyZone, position: [number, number, number]) => void;
  /** When true, taps draw a preview marker (placement in progress).
   *  When false, taps only zoom the camera. Defaults to false. */
  placementMode?: boolean;
  /** Lecture seule : pas de placement — mais l'orbite reste libre. */
  readOnly?: boolean;
  className?: string;
  /** Nombre réel de poses (layering compris). Par défaut : nombre de
   *  marqueurs — mais un marqueur peut représenter une pile. */
  poseCount?: number;
  /** Focus caméra contrôlé de l'extérieur (replay : tap sur une pose →
   *  dolly sur sa position). `null` = vue d'ensemble. `undefined` =
   *  focus interne géré par les clics. */
  focusPoint?: [number, number, number] | null;
};

/* -------------------------------------------------------------------------
 * Mannequin — load + normalize + apply clay material
 * --------------------------------------------------------------------- */

function Mannequin({
  onBodyClick,
  readOnly,
  isDark,
  shadows,
}: {
  onBodyClick?: (zone: BodyZone, position: [number, number, number]) => void;
  readOnly: boolean;
  isDark: boolean;
  shadows: boolean;
}) {
  const { scene } = useGLTF(MODEL_URL);

  const clayMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        // Dark : argile plus claire — le corps doit rester lisible sur
        // fond noir profond, pas se fondre dedans.
        color: isDark ? "#726c65" : "#d8d5d0",
        roughness: 0.82,
        metalness: 0.02,
      }),
    [isDark],
  );

  useEffect(() => () => { clayMaterial.dispose(); }, [clayMaterial]);

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.material = clayMaterial;
        mesh.castShadow = shadows;
        mesh.receiveShadow = shadows;
        mesh.frustumCulled = false;
      }
    });
  }, [scene, clayMaterial, shadows]);

  const transform = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const scale = size.y > 0 ? TARGET_HEIGHT / size.y : 1;
    return {
      scale,
      position: [
        -center.x * scale,
        -box.min.y * scale,
        -center.z * scale,
      ] as [number, number, number],
    };
  }, [scene]);

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (readOnly || !onBodyClick) return;
    e.stopPropagation();
    const p = e.point;
    const zone = closestZone(p);
    onBodyClick(zone, [p.x, p.y, p.z]);
  }

  function setCursor(c: string) {
    if (typeof document !== "undefined") document.body.style.cursor = c;
  }

  return (
    <group position={transform.position} scale={transform.scale}>
      <primitive
        object={scene}
        onClick={handleClick}
        onPointerOver={() => setCursor(readOnly ? "default" : "crosshair")}
        onPointerOut={() => setCursor("default")}
      />
    </group>
  );
}

useGLTF.preload(MODEL_URL);

/* -------------------------------------------------------------------------
 * Zone dots — les 15 points par défaut où poser un parfum
 * --------------------------------------------------------------------- */

function ZoneDot({
  zone,
  color,
  occupied,
  animated,
  offset,
  onSelect,
}: {
  zone: BodyZone;
  /** Couleur du dernier parfum si la zone est occupée, sinon null. */
  color: string | null;
  occupied: boolean;
  animated: boolean;
  offset: number;
  onSelect: (zone: BodyZone, position: [number, number, number]) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const anchor = ZONE_ANCHORS[zone];

  // Respiration douce, déphasée par point pour un scintillement organique.
  useFrame((state) => {
    if (!animated || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.scale.setScalar(1 + Math.sin(t * 1.4 + offset) * 0.18);
    state.invalidate();
  });

  return (
    <group position={[anchor.x, anchor.y, anchor.z]}>
      {/* Cible de tap élargie (invisible) — un point de 1cm serait
          intouchable au doigt. */}
      <mesh
        visible={false}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(zone, [anchor.x, anchor.y, anchor.z]);
        }}
      >
        <sphereGeometry args={[0.045, 8, 8]} />
      </mesh>
      <mesh ref={ref} renderOrder={2} raycast={() => null}>
        <sphereGeometry args={[occupied ? 0.016 : 0.011, 10, 10]} />
        <meshBasicMaterial
          color={color ?? "#9c9488"}
          transparent
          opacity={occupied ? 0.95 : 0.55}
          depthTest={false}
        />
      </mesh>
      {/* Fin anneau autour du point libre — lisibilité "c'est une cible". */}
      {!occupied && (
        <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={2} raycast={() => null}>
          <torusGeometry args={[0.022, 0.0012, 4, 20]} />
          <meshBasicMaterial
            color="#9c9488"
            transparent
            opacity={0.4}
            depthTest={false}
          />
        </mesh>
      )}
    </group>
  );
}

/* -------------------------------------------------------------------------
 * Markers — colorés, avec pile d'anneaux pour le layering
 * --------------------------------------------------------------------- */

/** Anneau de layering : pop d'empilement (overshoot) puis statique. */
function StackRing({
  radius,
  color,
  animated,
}: {
  radius: number;
  color: string;
  animated: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const start = useRef<number | null>(null);

  useFrame((state) => {
    if (!animated || !ref.current) return;
    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current;
    const D = 0.45;
    if (t >= D) {
      ref.current.scale.setScalar(1);
      return; // pop terminé → plus d'invalidation, rendu au repos
    }
    // easeOutBack — le léger dépassement donne le "clac" physique.
    const x = t / D;
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const eased = 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    ref.current.scale.setScalar(0.3 + 0.7 * eased);
    state.invalidate();
  });

  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]} renderOrder={3} raycast={() => null}>
      <torusGeometry args={[radius, 0.0042, 6, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.95} depthTest={false} />
    </mesh>
  );
}

function Marker({
  position,
  label,
  highlighted,
  isDark,
  color,
  stack,
  animated,
  dimmed = false,
}: {
  position: [number, number, number];
  label: string;
  highlighted: boolean;
  isDark: boolean;
  color?: string;
  stack?: string[];
  animated: boolean;
  dimmed?: boolean;
}) {
  const baseColor = color ?? (isDark ? "#f0ede8" : "#000");
  const haloRef = useRef<THREE.Mesh>(null);
  const spotRef = useRef<THREE.Mesh>(null);
  const layered = (stack?.length ?? 0) > 1;

  useFrame((state) => {
    if (!animated || !highlighted || !haloRef.current || !spotRef.current)
      return;
    const t = state.clock.elapsedTime;
    const wave = (Math.sin(t * 1.6) + 1) / 2;
    haloRef.current.scale.setScalar(1 + wave * 0.55);
    (haloRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.45 - wave * 0.32;
    spotRef.current.scale.setScalar(1 + Math.sin(t * 1.6) * 0.08);
    state.invalidate(); // keep demand-mode canvas alive while animating
  });

  return (
    <group position={position}>
      <mesh ref={haloRef} renderOrder={2} raycast={() => null}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={dimmed ? 0.3 : 0.25}
          depthTest={false}
        />
      </mesh>
      <mesh ref={spotRef} renderOrder={3} raycast={() => null}>
        <sphereGeometry args={[0.02, 12, 12]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={dimmed ? 0.65 : 1}
          depthTest={false}
        />
      </mesh>

      {/* Layering : un anneau concentrique par parfum de la pile. */}
      {layered &&
        stack!.map((ringColor, i) => (
          <StackRing
            key={`${ringColor}-${i}`}
            radius={0.034 + i * 0.015}
            color={ringColor}
            animated={animated}
          />
        ))}

      {label && highlighted && (
        <Html
          position={[0.05, 0.04, 0]}
          center={false}
          distanceFactor={0.9}
          zIndexRange={[50, 0]}
          style={{ pointerEvents: "none" }}
        >
          <span
            className="text-[10px] font-mono font-bold uppercase tracking-widest bg-background/95 px-2 py-0.5 border whitespace-nowrap"
            style={{ borderColor: baseColor, color: baseColor }}
          >
            {label}
          </span>
        </Html>
      )}
    </group>
  );
}

/** "Drawn" preview marker shown while the user is about to commit a placement. */
function PreviewMarker({
  position,
  isDark,
  animated,
}: {
  position: [number, number, number];
  isDark: boolean;
  animated: boolean;
}) {
  const color = isDark ? "#f0ede8" : "#000";
  const haloRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!animated) return;
    const t = state.clock.elapsedTime;
    const wave = (Math.sin(t * 1.8) + 1) / 2;
    if (haloRef.current) {
      haloRef.current.scale.setScalar(1 + wave * 0.55);
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.36 - wave * 0.28;
    }
    if (ring1Ref.current) {
      const growth = (t * 0.55) % 2;
      ring1Ref.current.scale.setScalar(1 + growth * 1.2);
      (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(
        0,
        0.55 - growth * 0.3,
      );
    }
    if (ring2Ref.current) {
      const growth = ((t + 1.0) * 0.55) % 2;
      ring2Ref.current.scale.setScalar(1 + growth * 1.2);
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(
        0,
        0.45 - growth * 0.25,
      );
    }
    state.invalidate(); // keep demand-mode canvas alive while animating
  });

  return (
    <group position={position}>
      <mesh ref={haloRef} renderOrder={2} raycast={() => null}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          depthTest={false}
        />
      </mesh>
      <mesh renderOrder={3} raycast={() => null}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshBasicMaterial color={color} depthTest={false} />
      </mesh>
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]} renderOrder={3} raycast={() => null}>
        <torusGeometry args={[0.03, 0.002, 4, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          depthTest={false}
        />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]} renderOrder={3} raycast={() => null}>
        <torusGeometry args={[0.03, 0.0015, 4, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------
 * Camera controller — drei CameraControls for orbit + animated focus
 * --------------------------------------------------------------------- */

// Camera framed to show full mannequin (head to feet) on all screen sizes.
// FOV 36° vertical + lookAt at mannequin mid-height (0.925m = 1.85m / 2).
const OVERVIEW = {
  pos: [0, 0.925, 3.4] as const,
  look: [0, 0.925, 0] as const,
};

/**
 * Directional key light with shadows that auto-update DISABLED.
 *
 * The mannequin is static (only the camera moves) so the shadow map only
 * needs to be rendered ONCE after the model loads. We force a single update
 * 400ms after mount, then the shadow stays cached forever — no per-frame
 * shadow render.
 */
function StaticShadowKey() {
  const ref = useRef<THREE.DirectionalLight>(null);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const l = ref.current;
    if (!l) return;
    l.shadow.autoUpdate = false;
    const id = setTimeout(() => {
      if (ref.current) {
        ref.current.shadow.needsUpdate = true;
        invalidate(); // force one render to apply the shadow bake
      }
    }, 400);
    return () => clearTimeout(id);
  }, [invalidate]);

  return (
    <directionalLight
      ref={ref}
      position={[2.4, 3.2, 2.8]}
      intensity={1.2}
      color="#fff2dc"
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-camera-near={1}
      shadow-camera-far={6}
      shadow-camera-left={-1.2}
      shadow-camera-right={1.2}
      shadow-camera-top={2.5}
      shadow-camera-bottom={-0.2}
      shadow-bias={-0.0005}
    />
  );
}

/** Invisible ground plane that catches the directional light's shadow. */
function ShadowFloor() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.001, 0]}
      receiveShadow
    >
      <planeGeometry args={[3, 3]} />
      <shadowMaterial transparent opacity={0.32} />
    </mesh>
  );
}

function CameraController({
  focusPoint,
  controlsRef,
}: {
  focusPoint: [number, number, number] | null;
  controlsRef: React.RefObject<ComponentRef<typeof CameraControls> | null>;
}) {
  // ─── Gestes mobiles natifs ────────────────────────────────────────────
  // 1 doigt  : rotation azimutale (le vertical est laissé au scroll de la
  //            page via touch-action: pan-y sur le conteneur).
  // 2 doigts : pinch = zoom (dolly), vers le point pincé (dollyToCursor).
  // Molette  : neutralisée — le scroll desktop ne doit jamais être capturé.
  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    const A = CameraControlsImpl.ACTION;
    c.touches.one = A.TOUCH_ROTATE;
    c.touches.two = A.TOUCH_DOLLY;
    c.touches.three = A.NONE;
    c.mouseButtons.wheel = A.NONE;
    c.mouseButtons.left = A.ROTATE;
    c.mouseButtons.right = A.NONE;
    c.mouseButtons.middle = A.NONE;
  }, [controlsRef]);

  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    if (focusPoint) {
      const [x, y, z] = focusPoint;
      // Top-down 3/4 view: camera ABOVE the click point and slightly in
      // front — l'angle du parfumeur qui applique.
      c.setLookAt(x, y + 0.45, z + 0.45, x, y, z, true);
    } else {
      c.setLookAt(
        OVERVIEW.pos[0],
        OVERVIEW.pos[1],
        OVERVIEW.pos[2],
        OVERVIEW.look[0],
        OVERVIEW.look[1],
        OVERVIEW.look[2],
        true,
      );
    }
  }, [focusPoint, controlsRef]);

  return null;
}

/* -------------------------------------------------------------------------
 * Top-level
 * --------------------------------------------------------------------- */

export function BodySilhouette3D({
  filledMarkers = [],
  highlightedZone,
  onBodyClick,
  placementMode = false,
  readOnly = false,
  className,
  poseCount,
  focusPoint: externalFocus,
}: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // ─── Réglages de fluidité ────────────────────────────────────────────
  const settings = useMannequinSettings();
  const profile = resolveProfile(settings.quality);
  /** Résolution courante — pilotée par PerformanceMonitor en mode auto. */
  const [adaptiveDpr, setAdaptiveDpr] = useState(
    Math.min(1.25, profile.dprRange[1]),
  );
  /** Coupe-circuit ombres du mode auto quand ça rame vraiment. */
  const [autoShadows, setAutoShadows] = useState(true);
  const shadows = profile.shadows && (profile.adaptive ? autoShadows : true);
  const animations = profile.markerAnimations;
  const dpr: number | [number, number] = profile.adaptive
    ? adaptiveDpr
    : profile.dprRange;

  const [focusPoint, setFocusPoint] = useState<[number, number, number] | null>(
    null,
  );
  /** Contrôlé (replay) ou interne (placement/inspection). */
  const effectiveFocus = externalFocus !== undefined ? externalFocus : focusPoint;
  /** Preview marker shown at the just-clicked point (before commit). */
  const [previewPoint, setPreviewPoint] = useState<
    [number, number, number] | null
  >(null);
  const controlsRef = useRef<ComponentRef<typeof CameraControls>>(null);

  // Clear the preview when the caller confirms a placement (highlightedZone
  // changes to one of the markers' zones) OR when it disappears. Ajustement
  // d'état PENDANT le render (pattern React) : on ne réagit qu'aux vraies
  // transitions de `highlightedZone`, jamais aux identités instables de
  // `filledMarkers` (défaut `[]`), sinon chaque render tuerait le preview.
  const [prevHighlighted, setPrevHighlighted] = useState(highlightedZone);
  if (prevHighlighted !== highlightedZone) {
    setPrevHighlighted(highlightedZone);
    if (!highlightedZone) setPreviewPoint(null);
  }
  if (highlightedZone && previewPoint) {
    // Un marqueur vient d'être posé sur la zone → le preview a rempli son rôle.
    const markerAtZone = filledMarkers.find((m) => m.zone === highlightedZone);
    if (markerAtZone) {
      setPreviewPoint(null);
      if (markerAtZone.position) setFocusPoint(markerAtZone.position);
    }
  }

  function handleBodyClick(
    zone: BodyZone,
    position: [number, number, number],
  ) {
    if (readOnly) return;
    // Camera zoom always — useful even when just inspecting.
    setFocusPoint(position);
    // Preview marker only when the parent says we're placing.
    if (placementMode) {
      setPreviewPoint(position);
    } else {
      setPreviewPoint(null);
    }
    onBodyClick?.(zone, position);
  }

  function resetView() {
    setFocusPoint(null);
    setPreviewPoint(null);
  }

  const filledCount = poseCount ?? filledMarkers.length;

  /** Zone → marqueur (pour colorer les points par défaut). */
  const markerByZone = useMemo(() => {
    const m = new Map<BodyZone, PlacedMarker>();
    for (const marker of filledMarkers) m.set(marker.zone, marker);
    return m;
  }, [filledMarkers]);

  return (
    <div
      className={clsx("relative w-full max-w-[380px] mx-auto", className)}
      // pan-y : un doigt vertical fait défiler la PAGE ; l'horizontal
      // tourne le mannequin, le pinch à deux doigts zoome.
      style={{ aspectRatio: "3 / 4", touchAction: "pan-y" }}
    >
      <Canvas
        shadows={shadows ? { type: THREE.PCFShadowMap } : false}
        frameloop="demand"
        dpr={dpr}
        camera={{ position: [...OVERVIEW.pos], fov: 36 }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onPointerMissed={() => !readOnly && resetView()}
      >
        {profile.adaptive && (
          <PerformanceMonitor
            // Ajuste la résolution en continu selon les FPS réels du
            // téléphone — le cœur du "on s'adapte aux vieux téléphones".
            onChange={({ factor }) => {
              const [min, max] = profile.dprRange;
              setAdaptiveDpr(
                Math.round((min + (max - min) * factor) * 100) / 100,
              );
            }}
            // Ça décline encore à basse résolution → on coupe les ombres.
            onDecline={() => {
              if (adaptiveDpr <= profile.dprRange[0] + 0.05) {
                setAutoShadows(false);
              }
            }}
          />
        )}

        <color attach="background" args={[isDark ? "#0f0f0e" : "#ece8e2"]} />

        <ambientLight intensity={isDark ? 0.75 : 0.55} />
        {shadows ? (
          <StaticShadowKey />
        ) : (
          <directionalLight
            position={[2.4, 3.2, 2.8]}
            intensity={1.2}
            color="#fff2dc"
          />
        )}
        <directionalLight
          position={[0, 2.5, -2.5]}
          intensity={isDark ? 0.85 : 0.6}
          color="#ffffff"
        />

        <Suspense fallback={null}>
          <Mannequin
            onBodyClick={handleBodyClick}
            readOnly={readOnly}
            isDark={isDark}
            shadows={shadows}
          />
        </Suspense>

        {shadows && <ShadowFloor />}

        {/* Points par défaut : les zones où poser un parfum. */}
        {placementMode &&
          ALL_ZONES.map((zone, i) => {
            const marker = markerByZone.get(zone);
            return (
              <ZoneDot
                key={zone}
                zone={zone}
                occupied={Boolean(marker)}
                color={marker?.color ?? null}
                animated={animations && !marker}
                offset={i * 0.7}
                onSelect={handleBodyClick}
              />
            );
          })}

        {filledMarkers.map((m, i) => {
          const pos: [number, number, number] = m.position ?? [
            ZONE_ANCHORS[m.zone].x,
            ZONE_ANCHORS[m.zone].y,
            ZONE_ANCHORS[m.zone].z,
          ];
          const isHighlighted = highlightedZone === m.zone;
          return (
            <Marker
              key={`${m.fragranceId}-${m.zone}-${i}`}
              position={pos}
              label={m.label}
              highlighted={isHighlighted}
              isDark={isDark}
              color={m.color}
              stack={m.stack}
              animated={animations}
              dimmed={m.dimmed ?? false}
            />
          );
        })}

        {previewPoint && (
          <PreviewMarker
            position={previewPoint}
            isDark={isDark}
            animated={animations}
          />
        )}

        <CameraControls
          ref={controlsRef}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2 + 0.15}
          polarRotateSpeed={ROTATE_SPEED_VALUES[settings.rotateSpeed] * 0.66}
          azimuthRotateSpeed={ROTATE_SPEED_VALUES[settings.rotateSpeed]}
          dollySpeed={ZOOM_SPEED_VALUES[settings.zoomSpeed]}
          dollyToCursor
          truckSpeed={0}
          minDistance={0.35}
          maxDistance={4.5}
          smoothTime={0.25}
          draggingSmoothTime={0.04}
        />
        <CameraController
          focusPoint={effectiveFocus}
          controlsRef={controlsRef}
        />
      </Canvas>

      {focusPoint && !readOnly && (
        <button
          type="button"
          onClick={resetView}
          aria-label="Vue d'ensemble"
          className="absolute top-2 right-2 px-3 py-1.5 bg-background/95 backdrop-blur border border-outline-variant text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 active:scale-95 transition-transform z-10"
        >
          <Icon name="zoom_out" size={12} />
          Vue d&apos;ensemble
        </button>
      )}

      {filledCount > 0 && (
        <div className="absolute bottom-2 left-2 px-3 py-1.5 bg-background/95 backdrop-blur border border-outline-variant text-[10px] uppercase tracking-widest font-mono z-10">
          {filledCount} pose{filledCount > 1 ? "s" : ""}
        </div>
      )}

      <div className="absolute bottom-2 right-2 px-3 py-1.5 bg-background/95 backdrop-blur border border-outline-variant text-[9px] uppercase tracking-widest font-mono text-outline z-10 flex items-center gap-1.5">
        <Icon name="360" size={11} />
        Tourner · pincer pour zoomer
      </div>

      {!readOnly && filledCount === 0 && !previewPoint && (
        <div className="absolute top-2 left-2 px-3 py-1.5 bg-background/95 backdrop-blur border border-outline-variant text-[10px] uppercase tracking-widest font-bold z-10 max-w-[calc(100%-4rem)]">
          Touche un point ou n&apos;importe où sur le corps
        </div>
      )}
    </div>
  );
}
