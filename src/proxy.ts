import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy Next 16 (ex-middleware) — rafraîchit la session Supabase à chaque
 * requête et redirige les visiteurs non connectés vers /login.
 *
 * Vérification optimiste uniquement : la vraie autorisation se fait au
 * niveau des données via les policies RLS de Supabase.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT : ne rien insérer entre createServerClient et getUser() —
  // le refresh du token expiré se joue ici.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/inscription") ||
    path.startsWith("/mot-de-passe-oublie") ||
    path.startsWith("/reinitialisation") ||
    path.startsWith("/auth") ||
    // Connexion de dev (elle-même gardée par NODE_ENV + DEV_AUTOLOGIN).
    path.startsWith("/api/dev-login");

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute && !path.startsWith("/auth") && !path.startsWith("/reinitialisation")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Tout sauf :
     * - _next/static, _next/image (assets Next)
     * - favicon, manifest, icônes, modèles 3D
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.svg|icon-maskable.svg|models/|sw.js).*)",
  ],
};
