import {
  Wallet,
  Receipt,
  Clock,
  TrendingUp,
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
import { RevenueDateFilter } from "@/features/admin/revenue-date-filter";
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

const YMD = /^\d{4}-\d{2}-\d{2}$/;
type SP = Record<string, string | string[] | undefined>;
const oneParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function RevenusPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireSuperAdmin();
  const t = await getTranslations();
  const dl = dateLocale(await getLocale());
  const admin = createAdminClient();

  // Bornes de période depuis l'URL (?from=YYYY-MM-DD&to=YYYY-MM-DD).
  const sp = await searchParams;
  const from = YMD.test(oneParam(sp.from)) ? oneParam(sp.from) : "";
  const to = YMD.test(oneParam(sp.to)) ? oneParam(sp.to) : "";
  const fromDate = from ? new Date(`${from}T00:00:00`) : null;
  const toDate = to ? new Date(`${to}T23:59:59.999`) : null;
  const inPeriod = (iso: string) => {
    const d = new Date(iso);
    return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
  };

  const { data: rowsRaw } = await admin
    .from("payments")
    .select("id, user_id, montant, moyen, type, statut, reference_transaction, created_at")
    .order("created_at", { ascending: false })
    .limit(10000);
  const rows = rowsRaw ?? [];

  // Transactions de la période sélectionnée (par défaut : tout l'historique).
  const periodRows = fromDate || toDate ? rows.filter((r) => inPeriod(r.created_at)) : rows;
  const reussiPeriod = periodRows.filter((r) => r.statut === "reussi");
  const pendingPeriod = periodRows.filter((r) => r.statut === "en_attente");

  const revenuePeriod = reussiPeriod.reduce((s, r) => s + Number(r.montant), 0);
  const pendingAmount = pendingPeriod.reduce((s, r) => s + Number(r.montant), 0);
  const ticketMoyen = reussiPeriod.length ? Math.round(revenuePeriod / reussiPeriod.length) : 0;
  const revenueAllTime = rows.filter((r) => r.statut === "reussi").reduce((s, r) => s + Number(r.montant), 0);

  // Répartitions (transactions réussies de la période).
  const byType = (["activation_candidate", "premium_employeur"] as PaymentType[]).map((type) => {
    const sub = reussiPeriod.filter((r) => r.type === type);
    return { type, count: sub.length, montant: sub.reduce((s, r) => s + Number(r.montant), 0) };
  });
  const byMethod = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[])
    .map((moyen) => {
      const sub = reussiPeriod.filter((r) => r.moyen === moyen);
      return { moyen, count: sub.length, montant: sub.reduce((s, r) => s + Number(r.montant), 0) };
    })
    .filter((m) => m.count > 0);

  // Réconciliation & intégrité — TOUJOURS sur tout l'historique (indépendant du filtre de vue).
  const now = Date.now();
  const stuck = rows.filter(
    (r) => r.statut === "en_attente" && now - new Date(r.created_at).getTime() > STUCK_AFTER_MS,
  );
  const allReussi = rows.filter((r) => r.statut === "reussi");
  const candIds = Array.from(
    new Set(allReussi.filter((r) => r.type === "activation_candidate").map((r) => r.user_id)),
  );
  const empIds = Array.from(
    new Set(allReussi.filter((r) => r.type === "premium_employeur").map((r) => r.user_id)),
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
  const fmtDay = (d: Date) => d.toLocaleDateString(dl, { day: "numeric", month: "short", year: "numeric" });
  const periodLabel =
    !fromDate && !toDate
      ? t("revenus.periodAllLabel")
      : fromDate && toDate
        ? t("revenus.periodRange", { from: fmtDay(fromDate), to: fmtDay(toDate) })
        : fromDate
          ? t("revenus.periodSince", { from: fmtDay(fromDate) })
          : t("revenus.periodUntil", { to: fmtDay(toDate!) });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{t("revenus.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("revenus.subtitle")}</p>
        </div>
        <ReconcileButton />
      </div>

      <RevenueDateFilter from={from} to={to} />

      {/* KPIs — chiffres de la période sélectionnée */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{periodLabel}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <Stat icon={<Wallet className="size-5" />} label={t("revenus.periodRevenue")} value={formatFcfa(revenuePeriod)} accent />
          <Stat icon={<Receipt className="size-5" />} label={t("revenus.successCount")} value={reussiPeriod.length} />
          <Stat icon={<Wallet className="size-5" />} label={t("revenus.avgTicket")} value={formatFcfa(ticketMoyen)} />
          <Stat
            icon={<Clock className="size-5" />}
            label={t("revenus.pending")}
            value={`${pendingPeriod.length}`}
            sub={pendingAmount > 0 ? formatFcfa(pendingAmount) : undefined}
          />
          <Stat icon={<TrendingUp className="size-5" />} label={t("revenus.allTime")} value={formatFcfa(revenueAllTime)} />
        </div>
      </div>

      {/* Réconciliation (tout l'historique) */}
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

      {/* Répartitions (période) */}
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

      {/* Transactions de la période */}
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 flex flex-wrap items-baseline justify-between gap-2 font-bold">
            {t("revenus.recent")}
            <span className="text-xs font-normal text-muted-foreground">
              {t("revenus.txTotal", { count: periodRows.length })}
            </span>
          </h2>
          {periodRows.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">{t("revenus.noneInPeriod")}</p>
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
                  {periodRows.slice(0, 50).map((r) => (
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
              {periodRows.length > 50 && (
                <p className="mt-3 text-xs text-muted-foreground">{t("revenus.showingFirst", { count: 50 })}</p>
              )}
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
