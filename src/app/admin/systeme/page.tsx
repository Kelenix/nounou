import {
  Activity, Database, Server, Users, Briefcase, BadgeCheck, Flag, ShieldCheck, CreditCard, Baby, Cpu, Rocket, Lock, Clock, Plug,
} from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { serverStats, sslExpiry, externalServices } from "@/features/system/health";
import { Card, CardContent } from "@/components/ui/card";
import { formatFcfa } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("systeme.metaTitle") };
}

async function count(admin: any, table: string, apply?: (q: any) => any): Promise<number> {
  let q = admin.from(table).select("*", { count: "exact", head: true });
  if (apply) q = apply(q);
  const { count } = await q;
  return count ?? 0;
}

const CRON_JOBS = [
  { action: "reconcile_payments", key: "cronReconcile" },
  { action: "email_relances", key: "cronRelances" },
  { action: "purge_comptes", key: "cronPurge" },
] as const;
/** Crons quotidiens : au-delà de 26 h sans exécution, on les considère en retard. */
const CRON_STALE_MS = 26 * 3_600_000;

type Tone = "ok" | "warn" | "bad" | "neutral";
const pctTone = (v: number | null, warn: number, bad: number): Tone =>
  v == null ? "neutral" : v >= bad ? "bad" : v >= warn ? "warn" : "ok";

function fmtBytes(b: number) {
  const units = ["o", "Ko", "Mo", "Go", "To"];
  let i = 0;
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024;
    i++;
  }
  return `${b.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ${units[i]}`;
}

export default async function SystemePage() {
  await requireSuperAdmin();
  const t = await getTranslations();
  const format = await getFormatter();
  const admin = createAdminClient();
  const now = new Date();
  const since24h = new Date(now.getTime() - 86_400_000).toISOString();

  // Latence base de données (aller-retour d'une requête simple).
  const t0 = Date.now();
  const { error: dbError } = await admin.from("profiles").select("id", { count: "exact", head: true });
  const dbLatency = Date.now() - t0;
  const dbOk = !dbError;

  const [server, sslExpiresAt, services, statsRes, cronRuns, pendingPayments, failedPayments24h, suspended] = await Promise.all([
    serverStats(),
    sslExpiry(process.env.NEXT_PUBLIC_APP_URL),
    externalServices(),
    admin.rpc("system_health_stats"),
    Promise.all(
      CRON_JOBS.map(async (j) => {
        const { data } = await admin
          .from("admin_audit_log")
          .select("created_at")
          .eq("action", j.action)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        return { ...j, lastRun: data?.created_at ? new Date(data.created_at) : null };
      }),
    ),
    count(admin, "payments", (q) => q.eq("statut", "en_attente")),
    count(admin, "payments", (q) => q.eq("statut", "echoue").gte("created_at", since24h)),
    count(admin, "profiles", (q) => q.eq("is_suspended", true).is("deleted_at", null)),
  ]);
  const stats = statsRes.data;

  const [total, candidates, employers, admins, activeNannies, activeOffers, applications, openReports, pendingIdentity, paidPayments] =
    await Promise.all([
      count(admin, "profiles"),
      count(admin, "profiles", (q) => q.eq("role", "candidate")),
      count(admin, "profiles", (q) => q.eq("role", "employer")),
      count(admin, "profiles", (q) => q.eq("role", "admin")),
      count(admin, "candidate_profiles", (q) => q.eq("is_active_paid", true)),
      count(admin, "offers", (q) => q.eq("status", "active")),
      count(admin, "applications"),
      count(admin, "reports", (q) => q.in("statut", ["ouvert", "en_cours"])),
      count(admin, "profiles", (q) => q.eq("role", "candidate").not("identity_doc_path", "is", null).eq("verification_level", "phone")),
      count(admin, "payments", (q) => q.eq("statut", "reussi")),
    ]);

  const { data: revRows } = await admin.from("payments").select("montant").eq("statut", "reussi").limit(10000);
  const revenue = (revRows ?? []).reduce((s, r) => s + (r.montant ?? 0), 0);

  const { data: audit } = await admin
    .from("admin_audit_log")
    .select("action, actor_name, target_name, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  const latencyColor = dbLatency < 150 ? "text-emerald-600" : dbLatency < 400 ? "text-amber-600" : "text-red-600";
  const latencyLabel = dbLatency < 150 ? t("systeme.fast") : dbLatency < 400 ? t("systeme.ok") : t("systeme.slow");

  const highLoad = server.cpu >= 80 || server.ram >= 90;
  const uptimeDays = Math.floor(server.uptimeSec / 86_400);
  const uptimeHours = Math.floor((server.uptimeSec % 86_400) / 3_600);
  const sslDays = sslExpiresAt ? Math.floor((sslExpiresAt.getTime() - now.getTime()) / 86_400_000) : null;
  const connPct = stats ? Math.round((stats.connections / stats.max_connections) * 100) : null;
  const reachable = services.filter((s) => s.ok).length + (dbOk ? 1 : 0);
  const servicesTotal = services.length + 1;
  const dash = "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("systeme.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("systeme.subtitle")}</p>
      </div>

      {/* Santé technique */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HealthCard icon={<Server className="size-5" />} label={t("systeme.app")} value={t("systeme.online")} ok />
        <HealthCard
          icon={<Database className="size-5" />}
          label={t("systeme.database")}
          value={dbOk ? t("systeme.connected") : t("systeme.disconnected")}
          ok={dbOk}
        />
        <HealthCard
          icon={<Activity className="size-5" />}
          label={t("systeme.dbLatency")}
          value={`${dbLatency} ms · ${latencyLabel}`}
          valueClassName={latencyColor}
          ok={dbLatency < 400}
        />
        <HealthCard
          icon={<Plug className="size-5" />}
          label={t("systeme.externalServices")}
          value={t("systeme.reachableCount", { ok: reachable, total: servicesTotal })}
          ok={reachable === servicesTotal}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Section icon={<Cpu className="size-4" />} title={t("systeme.secServer")}>
          <Row label={t("systeme.server")} value={t("systeme.online")} tone="ok" />
          <Row label={t("systeme.cpu")} value={`${server.cpu} % · ${t("systeme.cores", { count: server.cores })}`} tone={pctTone(server.cpu, 80, 95)} />
          <Row
            label={t("systeme.ram")}
            value={`${server.ram} % · ${server.ramTotalGb.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Go`}
            tone={pctTone(server.ram, 85, 95)}
          />
          <Row label={t("systeme.disk")} value={server.disk == null ? dash : `${server.disk} %`} tone={pctTone(server.disk, 80, 90)} />
          <Row label={t("systeme.uptime")} value={t("systeme.uptimeValue", { d: uptimeDays, h: uptimeHours })} />
          <Row label={t("systeme.load")} value={highLoad ? t("systeme.loadHigh") : t("systeme.loadNormal")} tone={highLoad ? "warn" : "ok"} />
        </Section>

        <Section icon={<Rocket className="size-4" />} title={t("systeme.secApp")}>
          <Row label={t("systeme.app")} value={t("systeme.online")} tone="ok" />
          <Row label={t("systeme.lastDeploy")} value={format.relativeTime(server.startedAt, now)} />
          <Row label={t("systeme.appMemory")} value={`${server.processRssMb} Mo`} />
          <Row label={t("systeme.nodeVersion")} value={server.nodeVersion} />
          <Row label={t("systeme.environment")} value={process.env.NODE_ENV ?? dash} />
        </Section>

        <Section icon={<Database className="size-4" />} title={t("systeme.secDatabase")}>
          <Row label={t("systeme.dbConnection")} value={dbOk ? t("systeme.connected") : t("systeme.disconnected")} tone={dbOk ? "ok" : "bad"} />
          <Row label={t("systeme.dbLatency")} value={`${dbLatency} ms`} tone={dbLatency < 150 ? "ok" : dbLatency < 400 ? "warn" : "bad"} />
          <Row
            label={t("systeme.dbConnections")}
            value={stats ? `${stats.connections} / ${stats.max_connections}` : dash}
            tone={pctTone(connPct, 80, 95)}
          />
          <Row label={t("systeme.dbSize")} value={stats ? fmtBytes(stats.db_size_bytes) : dash} />
          <Row label={t("systeme.avgQuery")} value={stats?.avg_query_ms != null ? `${stats.avg_query_ms} ms` : dash} />
          <Row
            label={t("systeme.slowQueries")}
            value={stats?.slow_queries != null ? String(stats.slow_queries) : dash}
            tone={stats?.slow_queries ? "warn" : "neutral"}
          />
          <Row label={t("systeme.deadlocks")} value={stats ? String(stats.deadlocks) : dash} tone={stats?.deadlocks ? "warn" : "neutral"} />
        </Section>

        <Section icon={<Lock className="size-4" />} title={t("systeme.secSecurity")}>
          <Row
            label={t("systeme.ssl")}
            value={
              sslDays == null
                ? t("systeme.sslNa")
                : sslDays < 0
                  ? t("systeme.sslExpired")
                  : t("systeme.sslValid", { days: sslDays })
            }
            tone={sslDays == null ? "neutral" : sslDays < 0 ? "bad" : sslDays < 14 ? "warn" : "ok"}
          />
          <Row label={t("systeme.activeSessions")} value={stats ? String(stats.active_sessions) : dash} />
          <Row label={t("systeme.activeUsers24h")} value={stats ? String(stats.active_users_24h) : dash} />
          <Row label={t("systeme.signIns24h")} value={stats ? String(stats.sign_ins_24h) : dash} />
          <Row label={t("systeme.suspendedAccounts")} value={String(suspended)} />
        </Section>

        <Section icon={<Clock className="size-4" />} title={t("systeme.secJobs")}>
          {cronRuns.map((j) => {
            const stale = !j.lastRun || now.getTime() - j.lastRun.getTime() > CRON_STALE_MS;
            return (
              <Row
                key={j.action}
                label={t(`systeme.${j.key}`)}
                value={j.lastRun ? `${format.relativeTime(j.lastRun, now)}${stale ? ` · ${t("systeme.late")}` : ""}` : t("systeme.neverRun")}
                tone={stale ? "warn" : "ok"}
              />
            );
          })}
          <Row label={t("systeme.pendingPayments")} value={String(pendingPayments)} />
          <Row label={t("systeme.failedPayments24h")} value={String(failedPayments24h)} tone={failedPayments24h > 0 ? "warn" : "neutral"} />
        </Section>

        <Section icon={<Plug className="size-4" />} title={t("systeme.secServices")}>
          <Row label="Supabase" value={dbOk ? `${t("systeme.reachable")} · ${dbLatency} ms` : t("systeme.unreachable")} tone={dbOk ? "ok" : "bad"} />
          {services.map((s) => (
            <Row
              key={s.name}
              label={s.name}
              value={s.ok ? `${t("systeme.reachable")} · ${s.ms} ms` : t("systeme.unreachable")}
              tone={s.ok ? "ok" : "bad"}
            />
          ))}
        </Section>
      </div>

      {/* Compteurs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Users className="size-5" />} label={t("systeme.totalUsers")} value={total} />
        <Stat icon={<Baby className="size-5" />} label={t("systeme.candidates")} value={candidates} />
        <Stat icon={<Briefcase className="size-5" />} label={t("systeme.employers")} value={employers} />
        <Stat icon={<ShieldCheck className="size-5" />} label={t("systeme.admins")} value={admins} />
        <Stat icon={<BadgeCheck className="size-5" />} label={t("systeme.activeNannies")} value={activeNannies} highlight />
        <Stat icon={<Briefcase className="size-5" />} label={t("systeme.activeOffers")} value={activeOffers} />
        <Stat icon={<Users className="size-5" />} label={t("systeme.applications")} value={applications} />
        <Stat icon={<CreditCard className="size-5" />} label={t("systeme.revenue")} value={formatFcfa(revenue)} sub={t("systeme.paymentsCount", { count: paidPayments })} />
      </div>

      {/* À traiter */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat icon={<BadgeCheck className="size-5" />} label={t("systeme.pendingIdentity")} value={pendingIdentity} warn={pendingIdentity > 0} />
        <Stat icon={<Flag className="size-5" />} label={t("systeme.openReports")} value={openReports} warn={openReports > 0} />
      </div>

      {/* Journal récent */}
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 font-bold">{t("systeme.recentActivity")}</h2>
          {audit && audit.length > 0 ? (
            <ul className="divide-y divide-border/60 text-sm">
              {audit.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="font-medium">{a.actor_name}</span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>{" "}
                    {a.target_name && <span className="text-muted-foreground">→ {a.target_name}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t("systeme.noActivity")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HealthCard({ icon, label, value, valueClassName, ok }: { icon: React.ReactNode; label: string; value: string; valueClassName?: string; ok?: boolean }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <span className={`flex size-10 items-center justify-center rounded-xl ${ok ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>{icon}</span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`font-bold ${valueClassName ?? ""}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="mb-2 flex items-center gap-2 font-bold">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary">{icon}</span>
          {title}
        </h2>
        <dl className="divide-y divide-border/60 text-sm">{children}</dl>
      </CardContent>
    </Card>
  );
}

const TONE_CLASS: Record<Tone, string> = {
  ok: "text-emerald-600",
  warn: "text-amber-600",
  bad: "text-red-600",
  neutral: "text-foreground",
};

function Row({ label, value, tone = "neutral" }: { label: string; value: string; tone?: Tone }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`text-right font-semibold ${TONE_CLASS[tone]}`}>{value}</dd>
    </div>
  );
}

function Stat({ icon, label, value, sub, highlight, warn }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; highlight?: boolean; warn?: boolean }) {
  return (
    <Card className={warn ? "border-amber-300" : highlight ? "border-primary/40" : ""}>
      <CardContent className="p-5">
        <span className={`flex size-9 items-center justify-center rounded-xl ${warn ? "bg-amber-50 text-amber-600" : "bg-primary-soft text-primary"}`}>{icon}</span>
        <p className="mt-3 text-2xl font-extrabold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
