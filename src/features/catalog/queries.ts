import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  ServiceType,
  PublicProfileRow,
  CandidateProfileRow,
} from "@/lib/supabase/database.types";

export type ProviderFilters = {
  service?: ServiceType;
  ville?: string;
  commune?: string;
  salaireMax?: number;
  tempsPlein?: boolean;
  q?: string;
};

export type ProviderItem = {
  profile: Pick<
    PublicProfileRow,
    "id" | "nom" | "prenom" | "photo_url" | "ville" | "commune" | "verification_level"
  >;
  candidate: Pick<
    CandidateProfileRow,
    | "services"
    | "experience_annees"
    | "temps_plein"
    | "description"
    | "salaire_souhaite"
    | "competences"
    | "disponibilite"
  >;
  createdAt: string;
  rating: { average: number | null; count: number };
};

/** Moyenne + nombre de notes pour un lot d'utilisateurs (une requête). */
async function ratingsFor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
): Promise<Map<string, { average: number | null; count: number }>> {
  const map = new Map<string, { average: number | null; count: number }>();
  if (ids.length === 0) return map;
  const { data } = await supabase.from("ratings").select("to_user, note_moyenne").in("to_user", ids);
  const acc = new Map<string, number[]>();
  for (const r of data ?? []) {
    const arr = acc.get(r.to_user) ?? [];
    arr.push(Number(r.note_moyenne ?? 0));
    acc.set(r.to_user, arr);
  }
  for (const id of ids) {
    const arr = acc.get(id);
    if (!arr || arr.length === 0) map.set(id, { average: null, count: 0 });
    else map.set(id, { average: Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10, count: arr.length });
  }
  return map;
}

/** Nombre total de prestataires (nounous) activés. */
export async function countActiveProviders(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("candidate_profiles")
    .select("user_id", { count: "exact", head: true })
    .eq("is_active_paid", true);
  return count ?? 0;
}

/** Liste publique des prestataires (nounous) activés, filtrable. */
export async function listPublicProviders(
  filters: ProviderFilters = {},
  limit = 24,
): Promise<ProviderItem[]> {
  const supabase = await createClient();

  let pq = supabase
    .from("public_profiles")
    .select("id, nom, prenom, photo_url, ville, commune, verification_level, created_at")
    .eq("role", "candidate")
    .eq("is_suspended", false);
  if (filters.ville) pq = pq.eq("ville", filters.ville);
  if (filters.commune) pq = pq.eq("commune", filters.commune);
  if (filters.q) pq = pq.or(`prenom.ilike.%${filters.q}%,nom.ilike.%${filters.q}%`);
  const { data: profs } = await pq.limit(80);

  const ids = (profs ?? []).map((p) => p.id);
  if (ids.length === 0) return [];

  let cq = supabase
    .from("candidate_profiles")
    .select("user_id, services, experience_annees, temps_plein, description, salaire_souhaite, competences, disponibilite")
    .eq("is_active_paid", true)
    .in("user_id", ids);
  if (filters.service) cq = cq.contains("services", [filters.service]);
  if (typeof filters.salaireMax === "number") cq = cq.lte("salaire_souhaite", filters.salaireMax);
  if (typeof filters.tempsPlein === "boolean") cq = cq.eq("temps_plein", filters.tempsPlein);
  const { data: cands } = await cq;

  const profById = new Map((profs ?? []).map((p) => [p.id, p]));
  const matchedIds = (cands ?? []).map((c) => c.user_id);
  const ratings = await ratingsFor(supabase, matchedIds);

  return (cands ?? [])
    .map((c): ProviderItem | null => {
      const p = profById.get(c.user_id);
      if (!p) return null;
      return {
        profile: p,
        candidate: {
          services: c.services,
          experience_annees: c.experience_annees,
          temps_plein: c.temps_plein,
          description: c.description,
          salaire_souhaite: c.salaire_souhaite,
          competences: c.competences,
          disponibilite: c.disponibilite,
        },
        createdAt: p.created_at,
        rating: ratings.get(c.user_id) ?? { average: null, count: 0 },
      };
    })
    .filter((x): x is ProviderItem => x !== null)
    .slice(0, limit);
}

/** Fiche publique d'un prestataire. */
export async function getPublicProvider(id: string): Promise<ProviderItem | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("public_profiles")
    .select("id, nom, prenom, photo_url, ville, commune, verification_level, created_at")
    .eq("id", id)
    .eq("role", "candidate")
    .maybeSingle();
  if (!profile) return null;

  const { data: candidate } = await supabase
    .from("candidate_profiles")
    .select("services, experience_annees, temps_plein, description, salaire_souhaite, competences, disponibilite, is_active_paid")
    .eq("user_id", id)
    .maybeSingle();
  if (!candidate || !candidate.is_active_paid) return null;

  const ratings = await ratingsFor(supabase, [id]);
  return {
    profile,
    candidate: {
      services: candidate.services,
      experience_annees: candidate.experience_annees,
      temps_plein: candidate.temps_plein,
      description: candidate.description,
      salaire_souhaite: candidate.salaire_souhaite,
      competences: candidate.competences,
      disponibilite: candidate.disponibilite,
    },
    createdAt: profile.created_at,
    rating: ratings.get(id) ?? { average: null, count: 0 },
  };
}
