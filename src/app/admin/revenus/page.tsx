import {
  Wallet,
  Receipt,
  Clock,
  XCircle,
  TrendingUp,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requireSuperAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReconcileButton } from "@/features/admin/reconcile-button";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatFcfa, dateLocale } from "@/lib/utils";
import type { PaymentMethod, PaymentStatus, PaymentType } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

const STUCK_AFTER_MS = 10 * 60 * 1000;

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("revenus.metaTitle") };
}

const STATUS_META: Record<PaymentStatus, string> = {
  reussi: "bg-emerald-100 text-emerald-800",
  en_attente: "bg-amber-100 text-amber-800",
  echoue: "bg-red-100 text-red-700",
  annule: "bg-muted text-muted-foreground",
};

export default async function RevenusPage() {
  await requireSuperAdmin();
  const t = await getTranslations();
  const dl = dateLocale(await getLocale());
  const admin = createAdminClient();

  const { data: rowsRaw } = await admin
    .from("payments")
    .select("id, user_id, montant, moyen, type, statut, reference_transaction, created_at")
    .order("created_at", { ascending: false })
    .limit(10000);
  const rows = rowsRaw ?? [];

  const now = Date.now();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const reussi = rows.filter((r) => r.statut === "reussi");
  const enAttente = rows.filter((r) => r.statut === "en_attente");
  const echoues = rows.filter((r) => r.statut === "echoue" || r.statut === "annule");

  const revenueTotal = reussi.reduce((s, r) => s + Number(r.montant), 0);
  const pendingAmount = enAttente.reduce((s, r) => s + Number(r.montant), 0);
  const revenue30 = reussi
    .filter((r) => new Date(r.created_at).getTime() >= thirtyDaysAgo)
    .reduce((s, r) => s + Number(r.montant), 0);
  const revenueMonth = reussi
    .filter((r) => new Date(r.created_at) >= monthStart)
    .reduce((s, r) => s + Number(r.montant), 0);
  const ticketMoyen = reussi.length ? Math.round(revenueTotal / reussi.length) : 0;

  // Répartitions (transactions réussies uniquement).
  const byType = (["activation_candidate", "premium_employeur"] as PaymentType[]).map((type) => {
    const sub = reussi.filter((r) => r.type === type);
    return { type, count: sub.length, montant: sub.reduce((s, r) => s + Number(r.montant), 0) };
  });
  const byMethod = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[])
    .map((moyen) => {
      const sub = reussi.filter((r) => r.moyen === moyen);
      return { moyen, count: sub.length, montant: sub.reduce((s, r) => s + Number(r.montant), 0) };
    })
    .filter((m) => m.count > 0);

  // Réconciliation — transactions « en attente » anciennes (webhook probablement perdu).
  const stuck = enAttente.filter((r) => now - new Date(r.created_at).getTime() > STUCK_AFTER_MS);

  // Intégrité interne — paiements réussis dont l'effet (activation/premium) n'a pas été appliqué.
  const candIds = Array.from(
    new Set(reussi.filter((r) => r.type === "activation_candidate").map((r) => r.user_id)),
  );
  const empIds = Array.from(
    new Set(reussi.filter((r) => r.type === "premium_employeur").map((r) => r.user_id)),
  );
  let effectMissing = 0;
  if (candIds.length) {
    const { data } = await admin
      .from("candidate_profiles")
      .select("user_id")
      .in("user_id", candIds)
      .eq("is_active_paid", false);
    effectMissing += data?.length ?? 0;
  }
  if (empIds.length) {
    const { data } = await admin
      .from("employer_profiles")
      .select("user_id")
      .in("user_id", empIds)
      .eq("is_premium", false);
    effectMissing += data?.length ?? 0;
  }

  const typeLabel = (type: PaymentType) =>
    type === "activation_candidate" ? t("revenus.typeActivation") : t("revenus.typePremium");
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(dl, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t("revenus.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("revenus.subtitle")}</p>
        </div>
        <ReconcileButton />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Stat icon={<Wallet className="size-5" />} label={t("revenus.total")} value={formatFcfa(revenueTotal)} accent />
        <Stat icon={<CalendarDays className="size-5" />} label={t("revenus.thisMonth")} value={formatFcfa(revenueMonth)} />
        <Stat icon={<TrendingUp className="size-5" />} label={t("revenus.last30")} value={formatFcfa(revenue30)} />
        <Stat icon={<Receipt className="size-5" />} label={t("revenus.successCount")} value={reussi.length} />
        <Stat icon={<Wallet className="size-5" />} label={t("revenus.avgTicket")} value={formatFcfa(ticketMoyen)} />
        <Stat
          icon={<Clock className="size-5" />}
          label={t("revenus.pending")}
          value={`${enAttente.length}`}
          sub={pendingAmount > 0 ? formatFcfa(pendingAmount) : undefined}
          warn={stuck.length > 0}
        />
      </div>

      {/* Réconciliation */}
      <Card className={stuck.length > 0 || effectMissing > 0 ? "border-amber-300" : ""}>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 font-bold">
                {stuck.length > 0 || effectMissing > 0 ? (
                  <AlertTriangle className="size-4 text-amber-600" />
                ) : (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                )}
                {t("revenus.reconcileTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("revenus.reconcileHelp")}</p>
            </div>
            {stuck.length > 0 && <ReconcileButton size="sm" variant="secondary" />}
          </div>

          {effectMissing > 0 && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t("revenus.effectMissing", { count: effectMissing })}
            </p>
          )}

          {stuck.length === 0 && effectMissing === 0 ? (
            <p className="text-sm text-muted-foreground">{t("revenus.reconcileClean")}</p>
          ) : stuck.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">{t("revenus.colRef")}</th>
                    <th className="py-2 pr-3 font-medium">{t("revenus.colAmount")}</th>
                    <th className="py-2 pr-3 font-medium">{t("revenus.colMethod")}</th>
                    <th className="py-2 pr-3 font-medium">{t("revenus.colDate")}</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {stuck.map((r) => (
                    <tr key={r.id}>
                      <td className="max-w-[180px] truncate py-2 pr-3 font-mono text-xs">{r.reference_transaction}</td>
                      <td className="py-2 pr-3 font-semibold">{formatFcfa(Number(r.montant))}</td>
                      <td className="py-2 pr-3">{PAYMENT_METHOD_LABELS[r.moyen]}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{fmtDate(r.created_at)}</td>
                      <td className="py-2 text-right">
                        {r.reference_transaction && (
                          <ReconcileButton
                            reference={r.reference_transaction}
                            label={t("revenus.verify")}
                            size="sm"
                            variant="ghost"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Répartitions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 font-bold">{t("revenus.byType")}</h2>
            <ul className="divide-y divide-border/60">
              {byType.map((it) => (
                <li key={it.type} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium">{typeLabel(it.type)}</span>
                  <span className="text-right">
                    <span className="font-semibold">{formatFcfa(it.montant)}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {t("revenus.txCount", { count: it.count })}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-bold">
              <Smartphone className="size-4 text-primary" /> {t("revenus.byMethod")}
            </h2>
            {byMethod.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">{t("revenus.noData")}</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {byMethod.map((it) => (
                  <li key={it.moyen} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium">{PAYMENT_METHOD_LABELS[it.moyen]}</span>
                    <span className="text-right">
                      <span className="font-semibold">{formatFcfa(it.montant)}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {t("revenus.txCount", { count: it.count })}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions récentes */}
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 font-bold">{t("revenus.recent")}</h2>
          {rows.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">{t("revenus.noData")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">{t("revenus.colDate")}</th>
                    <th className="py-2 pr-3 font-medium">{t("revenus.colType")}</th>
                    <th className="py-2 pr-3 font-medium">{t("revenus.colMethod")}</th>
                    <th className="py-2 pr-3 font-medium">{t("revenus.colAmount")}</th>
                    <th className="py-2 font-medium">{t("revenus.colStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rows.slice(0, 25).map((r) => (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap py-2 pr-3 text-muted-foreground">{fmtDate(r.created_at)}</td>
                      <td className="py-2 pr-3">{typeLabel(r.type)}</td>
                      <td className="py-2 pr-3">{PAYMENT_METHOD_LABELS[r.moyen]}</td>
                      <td className="py-2 pr-3 font-semibold">{formatFcfa(Number(r.montant))}</td>
                      <td className="py-2">
                        <Badge className={STATUS_META[r.statut]}>{t(`revenus.status_${r.statut}`)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  accent,
  warn,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <Card className={warn ? "border-amber-300" : accent ? "border-primary/40 bg-primary-soft/30" : ""}>
      <CardContent className="p-4">
        <span
          className={`flex size-9 items-center justify-center rounded-xl ${
            warn ? "bg-amber-50 text-amber-600" : "bg-primary-soft text-primary"
          }`}
        >
          {icon}
        </span>
        <p className="mt-3 text-lg font-extrabold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
