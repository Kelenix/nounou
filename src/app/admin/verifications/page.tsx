import { FileText } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireAdminSection } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { VerifyIdentityActions } from "@/features/admin/verify-identity-actions";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("verifications.metaTitle") };
}

export default async function VerificationsPage() {
  await requireAdminSection("users");
  const t = await getTranslations();
  const admin = createAdminClient();

  // Candidates ayant téléversé une pièce et pas encore vérifiées (niveau de base).
  const { data: pending } = await admin
    .from("profiles")
    .select("id, prenom, nom, photo_url, identity_doc_path, verification_level")
    .eq("role", "candidate")
    .eq("verification_level", "phone")
    .not("identity_doc_path", "is", null)
    .order("updated_at", { ascending: true });

  // URL signées (5 min) pour consulter les documents privés.
  const items = await Promise.all(
    (pending ?? []).map(async (p) => {
      const { data } = await admin.storage.from("identity-docs").createSignedUrl(p.identity_doc_path!, 300);
      return { ...p, docUrl: data?.signedUrl ?? null };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("verifications.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("verifications.subtitle")}</p>
      </div>

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
                      {p.docUrl && (
                        <a
                          href={p.docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
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
