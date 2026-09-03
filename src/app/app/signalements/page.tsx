import { ShieldCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dateLocale } from "@/lib/utils";
import type { ReportStatus } from "@/lib/supabase/database.types";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("userReports.metaTitle") };
}

const STATUS_CLASS: Record<ReportStatus, string> = {
  ouvert: "bg-amber-100 text-amber-800",
  en_cours: "bg-blue-100 text-blue-700",
  traite: "bg-primary-soft text-primary",
  rejete: "bg-muted text-muted-foreground",
};

export default async function SignalementsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const t = await getTranslations();
  const dl = dateLocale(await getLocale());

  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("from_user", profile.id)
    .order("created_at", { ascending: false });

  const list = reports ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-extrabold">{t("userReports.title")}</h1>
      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <ShieldCheck className="size-7" />
            </span>
            <p className="text-sm text-muted-foreground">
              {t("userReports.empty")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((r) => {
            return (
              <Card key={r.id}>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{t(`reportMotifs.${r.motif}`)}</span>
                    <Badge className={STATUS_CLASS[r.status]}>{t(`reportStatus.${r.status}`)}</Badge>
                  </div>
                  {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString(dl)}
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
