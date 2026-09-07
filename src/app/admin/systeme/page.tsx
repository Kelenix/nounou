import { Activity, Database, Server, Users, Briefcase, BadgeCheck, Flag, ShieldCheck, CreditCard, Baby } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
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

export default async function SystemePage() {
  await requireSuperAdmin();
  const t = await getTranslations();
  const admin = createAdminClient();

  // Latence base de données (aller-retour d'une requête simple).
  const t0 = Date.now();
  await admin.from("profiles").select("id", { count: "exact", head: true });
  const dbLatency = Date.now() - t0;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("systeme.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("systeme.subtitle")}</p>
      </div>

      {/* Santé technique */}
      <div className="grid gap-4 sm:grid-cols-3">
        <HealthCard icon={<Server className="size-5" />} label={t("systeme.app")} value={t("systeme.online")} ok />
        <HealthCard icon={<Database className="size-5" />} label={t("systeme.database")} value={t("systeme.connected")} ok />
        <HealthCard
          icon={<Activity className="size-5" />}
          label={t("systeme.dbLatency")}
          value={`${dbLatency} ms · ${latencyLabel}`}
          valueClassName={latencyColor}
          ok={dbLatency < 400}
        />
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
