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

  if (!code) {
    return NextResponse.redirect(new URL("/connexion?error=oauth", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/connexion?error=oauth", url.origin));
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

  return NextResponse.redirect(new URL(dest, url.origin));
}
