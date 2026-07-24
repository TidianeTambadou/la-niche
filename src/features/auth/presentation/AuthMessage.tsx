import type { AuthState } from "@/features/auth/application/actions";

/**
 * Zone de feedback monochrome : bloc contrasté pour l'erreur,
 * bloc bordé pour le succès. Jamais de rouge (design system).
 */
export function AuthMessage({ state }: { state: AuthState }) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="bubble-in bg-on-background text-background px-4 py-3 text-sm font-semibold"
      >
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p className="bubble-in border-2 border-on-background px-4 py-3 text-sm">
        {state.message}
      </p>
    );
  }
  return null;
}
