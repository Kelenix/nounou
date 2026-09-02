import { CreditCard, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminSettingsForm } from "@/features/admin/settings-form";
import { getPricing } from "@/features/settings/queries";
import { requireAdminSection } from "@/lib/admin";
import { SERVICE_OPTIONS } from "@/lib/constants";

export const metadata = { title: "Admin — Paramètres" };

export default async function AdminSettingsPage() {
  await requireAdminSection("settings");
  const pricing = await getPricing();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Paramètres du site</h1>
        <p className="text-sm text-muted-foreground">Configuration de la plateforme.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary-soft text-primary"><CreditCard className="size-5" /></span>
            <div>
              <h2 className="font-bold">Tarifs</h2>
              <p className="text-xs text-muted-foreground">Appliqués au paiement Mobile Money.</p>
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
              <h2 className="font-bold">Catégories de services</h2>
              <p className="text-xs text-muted-foreground">Services proposés sur la plateforme.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {SERVICE_OPTIONS.map((s) => (
              <Badge key={s.value} className="bg-secondary text-foreground">{s.label}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
