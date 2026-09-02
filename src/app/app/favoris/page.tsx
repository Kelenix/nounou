import Link from "next/link";
import { HeartOff } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { CandidateCard, type CandidateListItem } from "@/features/candidates/candidate-card";
import type { PublicProfileRow, CandidateProfileRow } from "@/lib/supabase/database.types";

export const metadata = { title: "Favoris" };

export default async function FavorisPage() {
  const profile = await requireRole("employer");
  const supabase = await createClient();

  const { data: favs } = await supabase
    .from("favorites")
    .select("candidate_id")
    .eq("employer_id", profile.id);

  const ids = (favs ?? []).map((f) => f.candidate_id);
  let items: CandidateListItem[] = [];

  if (ids.length > 0) {
    const { data: profs } = await supabase
      .from("public_profiles")
      .select("id, nom, prenom, photo_url, ville, commune, verification_level")
      .in("id", ids);
    const { data: cands } = await supabase
      .from("candidate_profiles")
      .select("user_id, services, experience_annees, temps_plein, description")
      .in("user_id", ids);

    const candById = new Map((cands ?? []).map((c) => [c.user_id, c]));
    items = (profs ?? [])
      .map((p): CandidateListItem | null => {
        const c = candById.get(p.id);
        if (!c) return null;
        return {
          profile: p as PublicProfileRow,
          candidate: {
            services: c.services,
            experience_annees: c.experience_annees,
            temps_plein: c.temps_plein,
            description: c.description,
          } as Pick<CandidateProfileRow, "services" | "experience_annees" | "temps_plein" | "description">,
        };
      })
      .filter((x): x is CandidateListItem => x !== null);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Favoris</h1>
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <HeartOff className="size-7" />
            </span>
            <p className="text-sm text-muted-foreground">Vous n&apos;avez pas encore de nounou en favori.</p>
            <Link href="/app/recherche" className="text-sm font-semibold text-primary">Trouver une nounou</Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((it) => <CandidateCard key={it.profile.id} item={it} />)}
        </div>
      )}
    </div>
  );
}
