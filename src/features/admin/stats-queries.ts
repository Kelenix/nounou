import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Admin = SupabaseClient<Database>;

export type SignupPoint = { label: string; count: number };
export type RevenuePoint = { label: string; revenue: number };
export type PaymentsPoint = { label: string; activation: number; premium: number };
export type DashboardStats = {
  signups: SignupPoint[];
  revenue: RevenuePoint[];
  payments: PaymentsPoint[];
};

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

/**
 * Séries temporelles pour les graphes du tableau de bord admin, calculées depuis
 * les données existantes (aucune table de métriques dédiée) :
 *   • inscriptions par jour sur 30 jours (profiles.created_at) ;
 *   • revenus par mois sur 6 mois (payments réussis) ;
 *   • paiements réussis par type et par mois (activation vs premium).
 * Les jours/mois sans donnée sont remplis à 0 pour une courbe continue.
 */
export async function getDashboardStats(admin: Admin, locale: string): Promise<DashboardStats> {
  const intlLocale = locale === "en" ? "en-US" : "fr-FR";
  const dayFmt = new Intl.DateTimeFormat(intlLocale, { day: "2-digit", month: "2-digit" });
  const monthFmt = new Intl.DateTimeFormat(intlLocale, { month: "short", year: "2-digit" });
  const now = new Date();

  // --- Inscriptions : 30 derniers jours ---
  const start30 = new Date(now);
  start30.setDate(now.getDate() - 29);
  start30.setHours(0, 0, 0, 0);
  const { data: signupRows } = await admin
    .from("profiles")
    .select("created_at")
    .gte("created_at", start30.toISOString());
  const signMap = new Map<string, number>();
  for (const r of signupRows ?? []) {
    const k = dayKey(new Date(r.created_at));
    signMap.set(k, (signMap.get(k) ?? 0) + 1);
  }
  const signups: SignupPoint[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(start30);
    d.setDate(start30.getDate() + i);
    signups.push({ label: dayFmt.format(d), count: signMap.get(dayKey(d)) ?? 0 });
  }

  // --- Paiements réussis : 6 derniers mois (revenu + répartition par type) ---
  const start6 = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const { data: payRows } = await admin
    .from("payments")
    .select("montant, type, created_at")
    .eq("statut", "reussi")
    .gte("created_at", start6.toISOString());

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { key: monthKey(d), label: monthFmt.format(d) };
  });
  const revMap = new Map<string, number>();
  const actMap = new Map<string, number>();
  const premMap = new Map<string, number>();
  for (const r of payRows ?? []) {
    const k = monthKey(new Date(r.created_at));
    revMap.set(k, (revMap.get(k) ?? 0) + Number(r.montant));
    if (r.type === "activation_candidate") actMap.set(k, (actMap.get(k) ?? 0) + 1);
    else if (r.type === "premium_employeur") premMap.set(k, (premMap.get(k) ?? 0) + 1);
  }

  const revenue: RevenuePoint[] = months.map((m) => ({ label: m.label, revenue: revMap.get(m.key) ?? 0 }));
  const payments: PaymentsPoint[] = months.map((m) => ({
    label: m.label,
    activation: actMap.get(m.key) ?? 0,
    premium: premMap.get(m.key) ?? 0,
  }));

  return { signups, revenue, payments };
}
