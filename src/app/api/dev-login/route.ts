import { redirect } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";

/**
 * Connexion de développement — UNIQUEMENT en local (`next dev`) et si
 * `DEV_AUTOLOGIN=1`. Sert aux tests e2e/agent sans saisie manuelle.
 * Inexistant en production : le double garde-fou coupe court.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development" || process.env.DEV_AUTOLOGIN !== "1") {
    return new Response("Not found", { status: 404 });
  }

  const email = process.env.DEV_TEST_EMAIL;
  const password = process.env.DEV_TEST_PASSWORD;
  if (!email || !password) {
    return new Response("DEV_TEST_EMAIL / DEV_TEST_PASSWORD manquants", {
      status: 500,
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return new Response(`Échec connexion dev : ${error.message}`, {
      status: 500,
    });
  }

  redirect("/");
}
