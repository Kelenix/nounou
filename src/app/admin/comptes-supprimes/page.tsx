import Link from "next/link";
import { UserX, CalendarDays, Trash2 } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { UserActions } from "@/features/admin/user-actions";
import { requireAdminSection } from "@/lib/admin";
import { cn, dateLocale } from "@/lib/utils";
import type { UserRole } from "@/lib/supabase/database.types";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("admin.metaDeleted") };
}

const PAGE_SIZE = 20;

type SP = Record<string, string | string[] | undefined>;

export default async function AdminDeletedAccountsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const me = await requireAdminSection("users");
  const t = await getTranslations();
  const sp = await searchParams;
  const role = (typeof sp.role === "string" ? sp.role : "") as UserRole | "";
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();
  let query = supabase.from("profiles").select("*", { count: "exact" }).not("deleted_at", "is", null);
  if (role) query = query.eq("role", role);
  const from = (page - 1) * PAGE_SIZE;
  const { data: users, count } = await query
    .order("deleted_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const list = users ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const dl = dateLocale(await getLocale());
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dl, { day: "numeric", month: "short", year: "numeric" });

  const roleLabel: Record<string, string> = {
    candidate: t("roles.candidate"),
    employer: t("roles.employer"),
    admin: t("roles.admin"),
  };
  const tabs: { value: UserRole | ""; label: string }[] = [
    { value: "", label: t("admin.allRoles") },
    { value: "candidate", label: t("admin.candidatesPlural") },
    { value: "employer", label: t("admin.employersPlural") },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("admin.deletedTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.deletedCount", { count: total })}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/admin/comptes-supprimes?role=${tab.value}` : "/admin/comptes-supprimes"}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              role === tab.value
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <UserX className="size-7" />
            </span>
            <p className="text-sm text-muted-foreground">{t("admin.noDeleted")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((u) => {
            const name = `${u.prenom ?? ""} ${u.nom ?? ""}`.trim();
            return (
              <Card key={u.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar src={u.photo_url} nom={u.nom} prenom={u.prenom} className="size-11" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-semibold">
                          {name || (u.anonymized_at ? t("admin.anonymousAccount") : t("admin.noName"))}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">#{u.id.slice(0, 8)}</span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3 shrink-0" /> {t("admin.registeredOn", { date: fmtDate(u.created_at) })}
                        </span>
                        <span className="text-muted-foreground/50">|</span>
                        <span className="inline-flex items-center gap-1">
                          <Trash2 className="size-3 shrink-0" /> {t("admin.deletedOn", { date: fmtDate(u.deleted_at!) })}{" "}
                          {u.deleted_by ? t("admin.deletedByAdmin") : t("admin.deletedBySelf")}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge className="bg-primary-soft text-primary">{u.role ? roleLabel[u.role] : "—"}</Badge>
                        <Badge className="bg-red-100 text-red-700">
                          {u.anonymized_at ? t("admin.anonymizedBadge") : t("admin.deletedBadge")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {(u.role !== "admin" || me.is_super_admin) && (
                    <UserActions
                      userId={u.id}
                      name={name || t("admin.thisUser")}
                      role={u.role}
                      suspended={u.is_suspended}
                      deleted
                      anonymized={!!u.anonymized_at}
                      hasSubscription={false}
                      subscription={null}
                      isSuperAdmin={me.is_super_admin}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination basePath="/admin/comptes-supprimes" page={page} totalPages={totalPages} params={role ? { role } : {}} />
    </div>
  );
}
