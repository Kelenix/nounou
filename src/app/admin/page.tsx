import { Users, UserCheck, Briefcase, FileText, Send, CreditCard, Flag, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/admin";
import { canAccess } from "@/lib/admin-permissions";
import { formatFcfa } from "@/lib/utils";

export const metadata = { title: "Admin — Tableau de bord" };

async function count(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "profiles" | "offers" | "applications" | "reports",
  filter?: { column: string; value: string },
) {
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = q.eq(filter.column, filter.value);
  const { count: c } = await q;
  return c ?? 0;
}

export default async function AdminDashboard() {
  const me = await requireAdmin();
  const supabase = await createClient();
  const canSeeRevenue = me.is_super_admin || canAccess(me, "settings");

  const totalUsers = await count(supabase, "profiles");
  const candidates = await count(supabase, "profiles", { column: "role", value: "candidate" });
  const employers = await count(supabase, "profiles", { column: "role", value: "employer" });
  const offers = await count(supabase, "offers");
  const applications = await count(supabase, "applications");
  const openReports = await count(supabase, "reports", { column: "status", value: "ouvert" });

  const { data: payments } = await supabase
    .from("payments")
    .select("montant, statut")
    .eq("statut", "reussi");
  const revenue = (payments ?? []).reduce((s, p) => s + Number(p.montant), 0);

  let recentUsersQuery = supabase
    .from("profiles")
    .select("id, prenom, nom, role, ville, created_at, is_super_admin")
    .order("created_at", { ascending: false })
    .limit(6);
  // Le Super Admin reste invisible pour le staff.
  if (!me.is_super_admin) recentUsersQuery = recentUsersQuery.eq("is_super_admin", false);
  const { data: recentUsers } = await recentUsersQuery;

  const { data: recentOffers } = await supabase
    .from("offers")
    .select("id, titre, ville, status, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            Bonjour {me.prenom ?? "Admin"} — {me.is_super_admin ? "vue complète de la plateforme." : "vue de vos responsabilités."}
          </p>
        </div>
        <Badge className={me.is_super_admin ? "bg-amber-100 text-amber-800" : "bg-primary-soft text-primary"}>
          <ShieldCheck className="size-3" /> {me.is_super_admin ? "Super Admin" : "Membre du staff"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <Stat icon={<Users className="size-5" />} label="Utilisateurs" value={totalUsers} />
        <Stat icon={<UserCheck className="size-5" />} label="Candidates" value={candidates} />
        <Stat icon={<Briefcase className="size-5" />} label="Employeurs" value={employers} />
        <Stat icon={<FileText className="size-5" />} label="Offres" value={offers} />
        <Stat icon={<Send className="size-5" />} label="Candidatures" value={applications} />
        <Stat icon={<Flag className="size-5" />} label="Signalements ouverts" value={openReports} highlight={openReports > 0} />
        {canSeeRevenue && (
          <Stat icon={<CreditCard className="size-5" />} label="Chiffre d'affaires" value={formatFcfa(revenue)} accent />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 font-bold">Derniers inscrits</h2>
            <ul className="divide-y divide-border/60">
              {(recentUsers ?? []).map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium">{`${u.prenom ?? ""} ${u.nom ?? ""}`.trim() || "Sans nom"}</span>
                  <span className="text-xs text-muted-foreground">
                    {u.role === "candidate" ? "Candidate" : u.role === "employer" ? "Employeur" : "Admin"}
                    {u.ville ? ` · ${u.ville}` : ""}
                  </span>
                </li>
              ))}
              {(recentUsers ?? []).length === 0 && <li className="py-3 text-sm text-muted-foreground">Aucun utilisateur.</li>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 font-bold">Dernières offres</h2>
            <ul className="divide-y divide-border/60">
              {(recentOffers ?? []).map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="truncate font-medium">{o.titre}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {o.status === "active" ? "Active" : "Clôturée"}{o.ville ? ` · ${o.ville}` : ""}
                  </span>
                </li>
              ))}
              {(recentOffers ?? []).length === 0 && <li className="py-3 text-sm text-muted-foreground">Aucune offre.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  highlight,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  highlight?: boolean;
  accent?: boolean;
}) {
  return (
    <Card
      className={`animate-fade-up transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
        accent ? "col-span-2 border-primary/30 bg-primary-soft/30 md:col-span-1" : ""
      }`}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <span
          className={`flex size-10 items-center justify-center rounded-2xl ${
            highlight ? "bg-destructive/10 text-destructive" : "bg-primary-soft text-primary"
          }`}
        >
          {icon}
        </span>
        <div>
          <div className="text-xl font-extrabold leading-none">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
