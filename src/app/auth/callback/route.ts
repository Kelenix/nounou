import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback OAuth (Google). Supabase renvoie ici avec un `code` (flux PKCE) que
 * l'on échange contre une session, puis on oriente l'utilisateur :
 *   - profil sans rôle  → /onboarding (compléter téléphone + rôle) ;
 *   - admin             → /admin ;
 *   - sinon             → `redirect` demandé (ou /app).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirectParam = url.searchParams.get("redirect");
  const safeRedirect = redirectParam && redirectParam.startsWith("/") ? redirectParam : "/app";

  // Derrière un reverse proxy (Nginx), `url.origin` peut valoir l'adresse interne
  // (0.0.0.0:3000). On reconstruit l'origine publique depuis les en-têtes du proxy.
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("host") ?? url.host;
  const origin = `${proto}://${host}`;

  if (!code) {
    // Supabase a renvoyé une erreur au lieu d'un code : on la remonte dans l'URL.
    const supaErr =
      url.searchParams.get("error_description") ||
      url.searchParams.get("error") ||
      "aucun_code";
    console.error("[auth/callback] Aucun code reçu. Paramètres:", Object.fromEntries(url.searchParams));
    return NextResponse.redirect(
      new URL(`/connexion?error=oauth&detail=${encodeURIComponent(supaErr)}`, origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] Échec de l'échange du code:", error.status, error.message);
    return NextResponse.redirect(
      new URL(`/connexion?error=oauth&detail=${encodeURIComponent(error.message)}`, origin),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/connexion?error=oauth", url.origin));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  let dest = safeRedirect;
  if (!profile?.role) dest = "/onboarding";
  else if (profile.role === "admin") dest = "/admin";

  return NextResponse.redirect(new URL(dest, origin));
}
