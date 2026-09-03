"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";

export function AdminSettingsForm({
  activationCandidate,
  premiumEmployeur,
}: {
  activationCandidate: number;
  premiumEmployeur: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const t = useTranslations();

  const [activation, setActivation] = useState(String(activationCandidate));
  const [premium, setPremium] = useState(String(premiumEmployeur));
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const a = Number(activation);
    const p = Number(premium);
    if (!Number.isFinite(a) || a < 0 || !Number.isFinite(p) || p < 0) {
      toast(t("admin.invalidAmounts"), "error");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("settings").upsert([
      { key: "prix_activation_candidate", value: a },
      { key: "prix_premium_employeur", value: p },
    ]);
    setLoading(false);
    if (error) {
      toast(t("admin.settingsFailed"), "error");
      return;
    }
    toast(t("admin.priceUpdated"), "success");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="activation">{t("admin.activationLabel")}</Label>
          <Input id="activation" type="number" inputMode="numeric" min={0} value={activation} onChange={(e) => setActivation(e.target.value)} />
          <p className="text-xs text-muted-foreground">{t("admin.activationHint")}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="premium">{t("admin.premiumLabel")}</Label>
          <Input id="premium" type="number" inputMode="numeric" min={0} value={premium} onChange={(e) => setPremium(e.target.value)} />
          <p className="text-xs text-muted-foreground">{t("admin.premiumHint")}</p>
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Spinner className="text-primary-foreground" /> : <><Save className="size-4" /> {t("admin.savePrices")}</>}
      </Button>
    </form>
  );
}
