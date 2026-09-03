import { CreditCard, Tag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminSettingsForm } from "@/features/admin/settings-form";
import { getPricing } from "@/features/settings/queries";
import { requireAdminSection } from "@/lib/admin";
import { SERVICE_OPTIONS } from "@/lib/constants";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("admin.metaSettings") };
}

export default async function AdminSettingsPage() {
  await requireAdminSection("settings");
  const pricing = await getPricing();
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{t("admin.settingsTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.settingsSubtitle")}</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary"><CreditCard className="size-5" /></span>
            <div>
              <h2 className="font-bold">{t("admin.pricingTitle")}</h2>
              <p className="text-xs text-muted-foreground">{t("admin.pricingSubtitle")}</p>
            </div>
          </div>
          <AdminSettingsForm activationCandidate={pricing.activationCandidate} premiumEmployeur={pricing.premiumEmployeur} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary"><Tag className="size-5" /></span>
            <div>
              <h2 className="font-bold">{t("admin.categoriesTitle")}</h2>
              <p className="text-xs text-muted-foreground">{t("admin.categoriesSubtitle")}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {SERVICE_OPTIONS.map((s) => (
              <Badge key={s.value} className="bg-secondary text-foreground">{t(`services.${s.value}`)}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
