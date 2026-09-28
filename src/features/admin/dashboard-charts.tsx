"use client";

import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { formatFcfa } from "@/lib/utils";
import type { SignupPoint, RevenuePoint, PaymentsPoint } from "@/features/admin/stats-queries";

// Palette validée (CVD-safe en clair ET sombre) : vert (marque) + bleu.
const GREEN = "#2E9E1F";
const BLUE = "#2563EB";
const AXIS = "#94a3b8"; // gris neutre lisible sur fond clair comme sombre

/** Props injectées par Recharts dans un tooltip personnalisé. */
type TipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ value?: number; name?: string; dataKey?: string; color?: string }>;
};

function TipBox({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">{children}</div>;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="mb-4 font-bold">{title}</h2>
        <div className="h-[240px] w-full">{children}</div>
      </CardContent>
    </Card>
  );
}

const axisProps = {
  stroke: AXIS,
  tick: { fill: AXIS, fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

export function DashboardCharts({
  signups,
  revenue,
  payments,
  showRevenue,
}: {
  signups: SignupPoint[];
  revenue: RevenuePoint[];
  payments: PaymentsPoint[];
  showRevenue: boolean;
}) {
  const t = useTranslations();

  function SignupTip({ active, label, payload }: TipProps) {
    if (!active || !payload?.length) return null;
    return (
      <TipBox>
        <div className="font-semibold text-foreground">{label}</div>
        <div className="text-muted-foreground">{t("admin.chartSignupsTip", { count: payload[0].value ?? 0 })}</div>
      </TipBox>
    );
  }

  function RevenueTip({ active, label, payload }: TipProps) {
    if (!active || !payload?.length) return null;
    return (
      <TipBox>
        <div className="font-semibold text-foreground">{label}</div>
        <div className="text-muted-foreground">{formatFcfa(payload[0].value ?? 0)}</div>
      </TipBox>
    );
  }

  function PaymentsTip({ active, label, payload }: TipProps) {
    if (!active || !payload?.length) return null;
    return (
      <TipBox>
        <div className="mb-1 font-semibold text-foreground">{label}</div>
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: p.color }} />
            {p.name} : <span className="font-medium text-foreground">{p.value ?? 0}</span>
          </div>
        ))}
      </TipBox>
    );
  }

  const compact = (v: number) =>
    new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(v);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Inscriptions — 30 jours (aire) */}
      <ChartCard title={t("admin.chartSignups")}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={signups} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GREEN} stopOpacity={0.35} />
                <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={AXIS} strokeOpacity={0.15} vertical={false} />
            <XAxis dataKey="label" interval={4} minTickGap={12} {...axisProps} />
            <YAxis allowDecimals={false} width={30} {...axisProps} />
            <Tooltip content={<SignupTip />} />
            <Area type="monotone" dataKey="count" stroke={GREEN} strokeWidth={2} fill="url(#signupFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {showRevenue && (
        <>
          {/* Revenus — 6 mois (barres) */}
          <ChartCard title={t("admin.chartRevenue")}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={AXIS} strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis width={46} tickFormatter={compact} {...axisProps} />
                <Tooltip cursor={{ fill: AXIS, fillOpacity: 0.08 }} content={<RevenueTip />} />
                <Bar dataKey="revenue" fill={GREEN} radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Paiements par type — 6 mois (barres empilées) */}
          <ChartCard title={t("admin.chartPayments")}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payments} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={AXIS} strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis allowDecimals={false} width={30} {...axisProps} />
                <Tooltip cursor={{ fill: AXIS, fillOpacity: 0.08 }} content={<PaymentsTip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="activation" stackId="p" name={t("admin.chartActivation")} fill={GREEN} maxBarSize={44} />
                <Bar dataKey="premium" stackId="p" name={t("admin.chartPremium")} fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </div>
  );
}
