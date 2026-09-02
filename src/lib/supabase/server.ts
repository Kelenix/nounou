import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv, getServiceRoleKey } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Client Supabase côté serveur, lié aux cookies de la requête (auth utilisateur).
 * À utiliser dans les Server Components, Route Handlers et Server Actions.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Server Component : ignoré, le middleware rafraîchit la session.
          }
        },
      },
    },
  );
}

/**
 * Client « admin » avec la clé service_role : contourne la RLS.
 * SERVEUR UNIQUEMENT, à réserver aux opérations de confiance (Edge/route handlers admin).
 */
export function createAdminClient() {
  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    getServiceRoleKey(),
    {
      cookies: { getAll: () => [], setAll: () => {} },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
