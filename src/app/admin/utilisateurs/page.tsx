import { Suspense } from "react";
import { Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { UserFilters } from "@/features/admin/user-filters";
import { UserActions, type SubscriptionInfo } from "@/features/admin/user-actions";
import { requireAdminSection } from "@/lib/admin";
import { getPricing } from "@/features/settings/queries";
import { formatPhoneCi } from "@/lib/utils";
import type { UserRole, PaymentMethod } from "@/lib/supabase/database.types";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("admin.metaUsers") };
}

const PAGE_SIZE = 15;

type SP = Record<string, string | string[] | undefined>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const me = await requireAdminSection("users");
  const t = await getTranslations();
  const roleLabel: Record<string, string> = {
    candidate: t("roles.candidate"),
    employer: t("roles.employer"),
    admin: t("roles.admin"),
  };
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const role = get("role") as UserRole | "";
  const status = get("status");
  const ville = get("ville");
  const q = get("q");
  const page = Math.max(1, Number(get("page")) || 1);

  const supabase = await createClient();

  let query = supabase.from("profiles").select("*", { count: "exact" });
  // Le Super Admin n'est visible que par lui-même : masqué au staff (liste + comptage).
  if (!me.is_super_admin) query = query.eq("is_super_admin", false);
  if (role) query = query.eq("role", role);
  if (status === "active") query = query.eq("is_suspended", false);
  if (status === "suspended") query = query.eq("is_suspended", true);
  if (ville) query = query.eq("ville", ville);
  if (q) query = query.or(`prenom.ilike.%${q}%,nom.ilike.%${q}%,phone.ilike.%${q}%`);

  const from = (page - 1) * PAGE_SIZE;
  const { data: users, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const list = users ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Abonnements pour les utilisateurs de la page.
  const ids = list.map((u) => u.id);
  const paidCandidates = new Set<string>();
  const premiumEmployers = new Set<string>();
  if (ids.length > 0) {
    const { data: cands } = await supabase
      .from("candidate_profiles")
      .select("user_id, is_active_paid")
      .in("user_id", ids);
    for (const c of cands ?? []) if (c.is_active_paid) paidCandidates.add(c.user_id);
    const { data: emps } = await supabase
      .from("employer_profiles")
      .select("user_id, is_premium")
      .in("user_id", ids);
    for (const e of emps ?? []) if (e.is_premium) premiumEmployers.add(e.user_id);
  }

  // Dernier paiement réussi par utilisateur (pour les détails d'abonnement).
  const pricing = await getPricing();
  const lastPayment = new Map<string, { montant: number; moyen: PaymentMethod; created_at: string }>();
  if (ids.length > 0) {
    const { data: pays } = await supabase
      .from("payments")
      .select("user_id, montant, moyen, created_at, statut")
      .eq("statut", "reussi")
      .in("user_id", ids)
      .order("created_at", { ascending: false });
    for (const p of pays ?? []) {
      if (!lastPayment.has(p.user_id)) {
        lastPayment.set(p.user_id, { montant: p.montant, moyen: p.moyen, created_at: p.created_at });
      }
    }
  }

  function subscriptionOf(userId: string, r: UserRole | null): SubscriptionInfo {
    const pay = lastPayment.get(userId);
    if (r === "candidate") {
      return { label: t("admin.subActivation"), montant: pay?.montant ?? pricing.activationCandidate, moyen: pay?.moyen ?? null, date: pay?.created_at ?? null };
    }
    return { label: t("admin.subPremium"), montant: pay?.montant ?? pricing.premiumEmployeur, moyen: pay?.moyen ?? null, date: pay?.created_at ?? null };
  }

  const linkParams: Record<string, string> = {};
  for (const k of ["role", "status", "ville", "q"]) if (get(k)) linkParams[k] = get(k);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("admin.usersTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.totalAccounts", { count: total })}</p>
      </div>

      <Suspense fallback={null}>
        <UserFilters />
      </Suspense>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <Users className="size-7" />
            </span>
            <p className="text-sm text-muted-foreground">{t("admin.noMatch")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((u) => {
            const hasSub = u.role === "candidate" ? paidCandidates.has(u.id) : u.role === "employer" ? premiumEmployers.has(u.id) : false;
            return (
              <Card key={u.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar src={u.photo_url} nom={u.nom} prenom={u.prenom} className="size-11" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {`${u.prenom ?? ""} ${u.nom ?? ""}`.trim() || t("admin.noName")}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatPhoneCi(u.phone)}
                        {u.ville ? ` · ${[u.commune, u.ville].filter(Boolean).join(", ")}` : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {u.is_super_admin ? (
                          <Badge className="bg-amber-100 text-amber-800">{t("admin.superAdmin")}</Badge>
                        ) : (
                          <Badge className="bg-primary-soft text-primary">{u.role ? roleLabel[u.role] : "—"}</Badge>
                        )}
                        {hasSub && <Badge className="bg-emerald-100 text-emerald-700">{t("admin.subscriber")}</Badge>}
                        {u.is_suspended && <Badge className="bg-red-100 text-red-700">{t("admin.suspended")}</Badge>}
                      </div>
                    </div>
                  </div>
                  {u.id !== me.id && !u.is_super_admin && (u.role !== "admin" || me.is_super_admin) && (
                    <UserActions
                      userId={u.id}
                      name={`${u.prenom ?? ""} ${u.nom ?? ""}`.trim() || t("admin.thisUser")}
                      role={u.role}
                      suspended={u.is_suspended}
                      hasSubscription={hasSub}
                      subscription={hasSub ? subscriptionOf(u.id, u.role) : null}
                      isSuperAdmin={me.is_super_admin}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination basePath="/admin/utilisateurs" page={page} totalPages={totalPages} params={linkParams} />
    </div>
  );
}
