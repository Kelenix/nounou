import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase service_role pour la préparation/nettoyage des tests E2E.
 * Ne JAMAIS utiliser ce client dans l'application : réservé aux tests locaux.
 */
export function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants (.env.local).");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function getSuperAdminId(): Promise<string> {
  const { data, error } = await adminDb().from("profiles").select("id").eq("is_super_admin", true).single();
  if (error || !data) throw new Error("Super Admin introuvable : lancez `npm run db:reset`.");
  return data.id as string;
}
