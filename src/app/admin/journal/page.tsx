import { ScrollText, UserPlus, UserCog, ShieldCheck, Ban, RotateCcw, Trash2, CreditCard } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { dateLocale } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("admin.metaJournal") };
}

const PAGE_SIZE = 20;
type SP = Record<string, string | string[] | undefined>;

const ACTION_ICON: Record<string, typeof UserCog> = {
  create_admin: UserPlus,
  set_role: UserCog,
  set_permissions: ShieldCheck,
  suspend: Ban,
  reactivate: RotateCcw,
  delete_user: Trash2,
  cancel_subscription: CreditCard,
};

export default async function AdminJournalPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requireSuperAdmin();
  const t = await getTranslations();
  const dl = dateLocale(await getLocale());
  const sp = await searchParams;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : "1") || 1);

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const { data: entries, count } = await supabase
    .from("admin_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const list = entries ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("admin.journalTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.journalSubtitle", { count: count ?? 0 })}</p>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <ScrollText className="size-7" />
            </span>
            <p className="text-sm text-muted-foreground">{t("admin.journalEmpty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((e) => {
            const Icon = ACTION_ICON[e.action] ?? ScrollText;
            const hasLabel = ACTION_ICON[e.action] !== undefined;
            return (
              <Card key={e.id}>
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{hasLabel ? t(`admin.action_${e.action}`) : e.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.journalBy")} <span className="font-medium">{e.actor_name ?? "?"}</span>
                      {e.target_name ? <> · {t("admin.journalTarget")} <span className="font-medium">{e.target_name}</span></> : null}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString(dl, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination basePath="/admin/journal" page={page} totalPages={totalPages} />
    </div>
  );
}
