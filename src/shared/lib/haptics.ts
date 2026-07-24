/**
 * Retour haptique — la Vibration API (supportée par Chrome Android ;
 * ignorée silencieusement par iOS Safari, où le simple `active:scale`
 * suffit à donner le feedback visuel).
 *
 * Chaque motif est court : le geste doit rester direct, jamais lourd.
 */

type HapticKind = "light" | "medium" | "success" | "select";

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 8,
  medium: 14,
  select: 5,
  success: [10, 30, 14],
};

export function haptic(kind: HapticKind = "light"): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    // Certains navigateurs exigent un geste utilisateur — sans danger.
  }
}
