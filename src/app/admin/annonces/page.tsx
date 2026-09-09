import { getTranslations } from "next-intl/server";
import { requireSuperAdmin } from "@/lib/admin";
import { Card, CardContent } from "@/components/ui/card";
import { AnnonceForm } from "@/features/admin/annonce-form";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("annonces.metaTitle") };
}

export default async function AnnoncesPage() {
  await requireSuperAdmin();
  const t = await getTranslations();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("annonces.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("annonces.subtitle")}</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <AnnonceForm />
        </CardContent>
      </Card>
    </div>
  );
}
