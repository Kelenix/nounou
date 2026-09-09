import { Mail, MailCheck, CalendarClock, UserMinus, AlertTriangle } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { dateLocale } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("adminRelances.metaTitle") };
}

const KINDS = ["complete_profile", "activate_candidate", "activate_premium"] as const;
type Kind = (typeof KINDS)[number];
const WEEK_MS = 7 * 86_400_000;

/** Somme d'un champ numérique d'un objet inconnu, en tolérant les valeurs absentes. */
function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export default async function AdminRelancesPage() {
  await requireSuperAdmin();
  const t = await getTranslations();
  const dl = dateLocale(await getLocale());
  const admin = createAdminClient();

  // Source de vérité des ENVOIS réels : les exécutions du cron journalisées.
  const { data: runs } = await admin
    .from("admin_audit_log")
    .select("details, created_at")
    .eq("action", "email_relances")
    .order("created_at", { ascending: false })
    .limit(1000);

  const now = Date.now();
  let total = 0;
  let last7 = 0;
  const byKind: Record<Kind, number> = { complete_profile: 0, activate_candidate: 0, activate_premium: 0 };

  for (const run of runs ?? []) {
    const details = (run.details ?? {}) as Record<string, unknown>;
    const sent = num(details.sent);
    total += sent;
    if (now - new Date(run.created_at).getTime() <= WEEK_MS) last7 += sent;
    const bk = (details.byKind ?? {}) as Record<string, unknown>;
    for (const k of KINDS) byKind[k] += num(bk[k]);
  }

  const lastRunAt = runs && runs.length > 0 ? runs[0].created_at : null;

  // Désinscrits (opt-out) : simple compteur.
  const { count: optOut } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("email_opt_out", true);

  const resendConfigured = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("adminRelances.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("adminRelances.subtitle")}</p>
      </div>

      {!resendConfigured && (
        <Card className="border-amber-300">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="size-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">{t("adminRelances.notConfigured")}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={<MailCheck className="size-5" />} label={t("adminRelances.statTotal")} value={total} accent />
        <Stat icon={<CalendarClock className="size-5" />} label={t("adminRelances.stat7d")} value={last7} />
        <Stat icon={<UserMinus className="size-5" />} label={t("adminRelances.statOptOut")} value={optOut ?? 0} />
      </div>

      <p className="text-xs text-muted-foreground">
        {lastRunAt
          ? t("adminRelances.lastRun", {
              when: new Date(lastRunAt).toLocaleString(dl, {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }),
            })
          : t("adminRelances.neverRun")}
      </p>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <Mail className="size-4 text-primary" /> {t("adminRelances.byKindTitle")}
          </h2>
          <ul className="divide-y divide-border/60">
            {KINDS.map((k) => (
              <li key={k} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium">{t(`adminRelances.kind_${k}`)}</span>
                <span className="text-xs text-muted-foreground">
                  {t("adminRelances.emailsCount", { count: byKind[k] })}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-primary/40 bg-primary-soft/30" : ""}>
      <CardContent className="p-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary">{icon}</span>
        <p className="mt-3 text-lg font-extrabold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
