import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { SearchFilters } from "@/features/search/search-filters";
import { OfferCard } from "@/features/offers/offer-card";
import { CandidateCard, type CandidateListItem } from "@/features/candidates/candidate-card";
import type { ServiceType, PublicProfileRow } from "@/lib/supabase/database.types";

export const metadata = { title: "Rechercher" };

const PAGE_SIZE = 12;
type SP = Record<string, string | string[] | undefined>;

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");

  const ville = get("ville");
  const service = get("service") as ServiceType | "";
  const page = Math.max(1, Number(get("page")) || 1);

  // ---------------- Candidate : liste d'offres (paginée) ----------------
  if (profile.role !== "employer") {
    const linkParams: Record<string, string> = {};
    for (const k of ["service", "ville", "salaireMax"]) if (get(k)) linkParams[k] = get(k);

    let q = supabase.from("offers").select("*", { count: "exact" }).eq("status", "active");
    if (ville) q = q.eq("ville", ville);
    if (service) q = q.eq("type_service", service);
    const salaireMin = get("salaireMax");
    if (salaireMin) q = q.gte("salaire", Number(salaireMin));
    const from = (page - 1) * PAGE_SIZE;
    const { data: offers, count } = await q.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Trouver une offre</h1>
        <Suspense fallback={null}><SearchFilters role="candidate" /></Suspense>
        {offers && offers.length > 0 ? (
          <>
            <div className="grid gap-3 lg:grid-cols-2">
              {offers.map((o) => <OfferCard key={o.id} offer={o} />)}
            </div>
            <Pagination basePath="/app/recherche" page={page} totalPages={totalPages} params={linkParams} />
          </>
        ) : (
          <EmptyState label="Aucune offre ne correspond à votre recherche." />
        )}
      </div>
    );
  }

  // ---------------- Employeur : recherche de candidates (paginée) ----------------
  const commune = get("commune");
  const linkParams: Record<string, string> = {};
  for (const k of ["service", "ville", "commune", "expMin", "tempsPlein"]) if (get(k)) linkParams[k] = get(k);

  let pq = supabase
    .from("public_profiles")
    .select("id, nom, prenom, photo_url, ville, commune, verification_level")
    .eq("role", "candidate")
    .eq("is_suspended", false);
  if (ville) pq = pq.eq("ville", ville);
  if (commune) pq = pq.eq("commune", commune);
  const { data: profs } = await pq.limit(200);

  const ids = (profs ?? []).map((p) => p.id);
  let all: CandidateListItem[] = [];

  if (ids.length > 0) {
    let cq = supabase
      .from("candidate_profiles")
      .select("user_id, services, experience_annees, temps_plein, description")
      .eq("is_active_paid", true)
      .in("user_id", ids);
    if (service) cq = cq.contains("services", [service]);
    const expMin = get("expMin");
    if (expMin) cq = cq.gte("experience_annees", Number(expMin));
    const tempsPlein = get("tempsPlein");
    if (tempsPlein) cq = cq.eq("temps_plein", tempsPlein === "true");
    const { data: cands } = await cq;

    const profById = new Map<string, PublicProfileRow>((profs ?? []).map((p) => [p.id, p as PublicProfileRow]));
    all = (cands ?? [])
      .map((c): CandidateListItem | null => {
        const p = profById.get(c.user_id);
        if (!p) return null;
        return {
          profile: p,
          candidate: {
            services: c.services,
            experience_annees: c.experience_annees,
            temps_plein: c.temps_plein,
            description: c.description,
          },
        };
      })
      .filter((x): x is CandidateListItem => x !== null);
  }

  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Trouver une candidate</h1>
      <Suspense fallback={null}><SearchFilters role="employer" /></Suspense>
      {items.length > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((it) => <CandidateCard key={it.profile.id} item={it} />)}
          </div>
          <Pagination basePath="/app/recherche" page={page} totalPages={totalPages} params={linkParams} />
        </>
      ) : (
        <EmptyState label="Aucune candidate ne correspond à votre recherche." />
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <SearchX className="size-7" />
        </span>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
