import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow, UserRole } from "@/lib/supabase/database.types";

/** Récupère l'utilisateur connecté et son profil, ou `null`. */
export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Compte supprimé ou suspendu : traité comme non connecté partout dans l'app
  // (blocage immédiat, même pour une session déjà ouverte avant l'action admin).
  if (data?.deleted_at || data?.is_suspended) return null;

  return data ?? null;
}

/** Exige une session ; sinon redirige vers /connexion. */
export async function requireProfile(): Promise<ProfileRow> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion");
  // Onboarding non terminé (rôle non choisi) → forcer l'onboarding.
  if (!profile.role) redirect("/onboarding");
  return profile;
}

/** Exige un rôle précis ; sinon redirige vers l'accueil de l'app. */
export async function requireRole(role: UserRole): Promise<ProfileRow> {
  const profile = await requireProfile();
  if (profile.role !== role) redirect("/app");
  return profile;
}
