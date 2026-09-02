import { createClient } from "@/lib/supabase/server";
import { requireAdminSection } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { ReportActions } from "@/features/admin/report-actions";
import type { ReportMotif, ReportStatus } from "@/lib/supabase/database.types";

export const metadata = { title: "Admin — Signalements" };

const PAGE_SIZE = 15;
type SP = Record<string, string | string[] | undefined>;

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

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requireAdminSection("reports");
  const sp = await searchParams;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : "1") || 1);

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const { data: reports, count } = await supabase
    .from("reports")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const list = reports ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Signalements ({total})</h1>
      {list.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Aucun signalement.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((r) => {
            const s = STATUS_META[r.status];
            const open = r.status === "ouvert" || r.status === "en_cours";
            return (
              <Card key={r.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{MOTIF_LABELS[r.motif]}</span>
                    <Badge className={s.className}>{s.label}</Badge>
                  </div>
                  {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    Signalé le {new Date(r.created_at).toLocaleDateString("fr-FR")}
                  </p>
                  {open && <ReportActions reportId={r.id} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Pagination basePath="/admin/signalements" page={page} totalPages={totalPages} />
    </div>
  );
}
