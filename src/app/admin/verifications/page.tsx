import { FileText, Mail, CalendarDays } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requireAdminSection } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { VerificationFilters } from "@/features/admin/verification-filters";
import { VerifyIdentityActions } from "@/features/admin/verify-identity-actions";
import { dateLocale } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("verifications.metaTitle") };
}

type SP = Record<string, string | string[] | undefined>;

export default async function VerificationsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdminSection("users");
  const t = await getTranslations();
  const dl = dateLocale(await getLocale());
  const admin = createAdminClient();

  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const period = get("period"); // "" | today | 7d | 30d (date d'inscription)
  const sort = get("sort"); // "" (récent) | old

  // Candidates ayant téléversé une pièce et pas encore vérifiées (niveau de base).
  let query = admin
    .from("profiles")
    .select("id, prenom, nom, photo_url, identity_doc_path, verification_level, created_at")
    .eq("role", "candidate")
    .eq("verification_level", "phone")
    .not("identity_doc_path", "is", null);

  // Filtre « date d'inscription » (même logique que la page Utilisateurs).
  const now = Date.now();
  let since: string | null = null;
  if (period === "today") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    since = d.toISOString();
  } else if (period === "7d") since = new Date(now - 7 * 86_400_000).toISOString();
  else if (period === "30d") since = new Date(now - 30 * 86_400_000).toISOString();
  if (since) query = query.gte("created_at", since);

  const { data: pending } = await query.order("created_at", { ascending: sort === "old" });

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dl, { day: "numeric", month: "short", year: "numeric" });

  // URL signées (5 min) + e-mail (côté auth) pour consulter/traiter chaque dossier.
  const items = await Promise.all(
    (pending ?? []).map(async (p) => {
      const [{ data: signed }, { data: userData }] = await Promise.all([
        admin.storage.from("identity-docs").createSignedUrl(p.identity_doc_path!, 300),
        admin.auth.admin.getUserById(p.id),
      ]);
      return { ...p, docUrl: signed?.signedUrl ?? null, email: userData?.user?.email ?? null };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("verifications.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("verifications.subtitle")}</p>
      </div>

      <VerificationFilters />

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">{t("verifications.empty")}</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((p) => {
            const name = `${p.prenom ?? ""} ${p.nom ?? ""}`.trim() || t("verifications.candidate");
            return (
              <Card key={p.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={p.photo_url} nom={p.nom} prenom={p.prenom} className="size-12" />
                    <div>
                      <p className="font-semibold">{name}</p>
                      {p.email && (
                        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <Mail className="size-3 shrink-0" /> {p.email}
                        </p>
                      )}
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="size-3 shrink-0" /> {t("admin.registeredOn", { date: fmtDate(p.created_at) })}
                      </p>
                      {p.docUrl && (
                        <a
                          href={p.docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <FileText className="size-4" /> {t("verifications.viewDoc")}
                        </a>
                      )}
                    </div>
                  </div>
                  <VerifyIdentityActions userId={p.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
