import type { AuthState } from "@/features/auth/application/actions";

/**
 * Feedback Club : erreur en carte coral douce, succès en carte lime douce.
 */
export function AuthMessage({ state }: { state: AuthState }) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="bubble-in rounded-2xl bg-pop-soft px-4 py-3 text-sm font-bold text-pop"
      >
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p className="bubble-in rounded-2xl bg-lime-soft px-4 py-3 text-sm font-bold text-lime">
        {state.message}
      </p>
    );
  }
  return null;
}
