import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminSection } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { ReportActions } from "@/features/admin/report-actions";
import { dateLocale } from "@/lib/utils";
import type { ReportStatus } from "@/lib/supabase/database.types";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("admin.metaReports") };
}

const PAGE_SIZE = 15;
type SP = Record<string, string | string[] | undefined>;

const STATUS_CLASS: Record<ReportStatus, string> = {
  ouvert: "bg-amber-100 text-amber-800",
  en_cours: "bg-blue-100 text-blue-700",
  traite: "bg-primary-soft text-primary",
  rejete: "bg-muted text-muted-foreground",
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requireAdminSection("reports");
  const t = await getTranslations();
  const dl = dateLocale(await getLocale());
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
      <h1 className="text-2xl font-extrabold tracking-tight">{t("admin.reportsTitle", { count: total })}</h1>
      {list.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {t("admin.noReports")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((r) => {
            const open = r.status === "ouvert" || r.status === "en_cours";
            return (
              <Card key={r.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{t(`reportMotifs.${r.motif}`)}</span>
                    <Badge className={STATUS_CLASS[r.status]}>{t(`reportStatus.${r.status}`)}</Badge>
                  </div>
                  {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    {t("admin.reportedOn", { date: new Date(r.created_at).toLocaleDateString(dl) })}
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
