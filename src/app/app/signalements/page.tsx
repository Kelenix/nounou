import { ShieldCheck } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReportMotif, ReportStatus } from "@/lib/supabase/database.types";

export const metadata = { title: "Mes signalements" };

const MOTIF_LABELS: Record<ReportMotif, string> = {
  fausse_identite: "Fausse identité",
  arnaque: "Arnaque",
  harcelement: "Harcèlement",
  offre_frauduleuse: "Offre frauduleuse",
  comportement: "Comportement déplacé",
  conditions_differentes: "Conditions différentes",
  autre: "Autre",
};

const STATUS_META: Record<ReportStatus, { label: string; className: string }> = {
  ouvert: { label: "Ouvert", className: "bg-amber-100 text-amber-800" },
  en_cours: { label: "En cours", className: "bg-blue-100 text-blue-700" },
  traite: { label: "Traité", className: "bg-primary-soft text-primary" },
  rejete: { label: "Rejeté", className: "bg-muted text-muted-foreground" },
};

export default async function SignalementsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("from_user", profile.id)
    .order("created_at", { ascending: false });

  const list = reports ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold">Mes signalements</h1>
      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <ShieldCheck className="size-7" />
            </span>
            <p className="text-sm text-muted-foreground">
              Vous n&apos;avez effectué aucun signalement. Tant mieux !
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((r) => {
            const s = STATUS_META[r.status];
            return (
              <Card key={r.id}>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{MOTIF_LABELS[r.motif]}</span>
                    <Badge className={s.className}>{s.label}</Badge>
                  </div>
                  {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
