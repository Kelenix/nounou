import Link from "next/link";
import { Check, Sparkles, CreditCard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPricing } from "@/features/settings/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PayForm } from "@/features/payments/pay-form";
import { getAvailablePaymentMethods } from "@/features/payments/provider";
import { formatFcfa } from "@/lib/utils";
import type { PaymentMethod, PaymentType } from "@/lib/supabase/database.types";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("payment.metaTitle") };
}

export default async function PaiementPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const pricing = await getPricing();
  const methods = getAvailablePaymentMethods();
  const t = await getTranslations();

  if (profile.role === "candidate") {
    const { data: cand } = await supabase
      .from("candidate_profiles")
      .select("is_active_paid")
      .eq("user_id", profile.id)
      .maybeSingle();
    if (cand?.is_active_paid) return <AlreadyDone label={t("payment.alreadyActivated")} backLabel={t("payment.backHome")} />;
    return (
      <Checkout
        type="activation_candidate"
        title={t("payment.activateTitle")}
        montant={pricing.activationCandidate}
        icon={<Sparkles className="size-6" />}
        features={[
          t("payment.activateFeature1"),
          t("payment.activateFeature2"),
          t("payment.activateFeature3"),
        ]}
        phone={profile.phone ?? ""}
        methods={methods}
      />
    );
  }

  if (profile.role === "employer") {
    const { data: emp } = await supabase
      .from("employer_profiles")
      .select("is_premium")
      .eq("user_id", profile.id)
      .maybeSingle();
    if (emp?.is_premium) return <AlreadyDone label={t("payment.alreadyPremium")} backLabel={t("payment.backHome")} />;
    return (
      <Checkout
        type="premium_employeur"
        title={t("payment.premiumTitle")}
        montant={pricing.premiumEmployeur}
        icon={<CreditCard className="size-6" />}
        features={[
          t("payment.premiumFeature1"),
          t("payment.premiumFeature2"),
          t("payment.premiumFeature3"),
        ]}
        phone={profile.phone ?? ""}
        methods={methods}
      />
    );
  }

  return <AlreadyDone label={t("payment.noPaymentNeeded")} backLabel={t("payment.backHome")} />;
}

function Checkout({
  type,
  title,
  montant,
  icon,
  features,
  phone,
  methods,
}: {
  type: PaymentType;
  title: string;
  montant: number;
  icon: React.ReactNode;
  features: string[];
  phone: string;
  methods: PaymentMethod[];
}) {
  return (
    <div className="space-y-5">
      <Card className="border-primary/30 bg-primary-soft/40">
        <CardContent className="space-y-3 p-5">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            {icon}
          </span>
          <h1 className="text-xl font-extrabold">{title}</h1>
          <p className="text-2xl font-extrabold text-primary">{formatFcfa(montant)}</p>
          <ul className="space-y-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <PayForm type={type} montant={montant} defaultPhone={phone} methods={methods} />
    </div>
  );
}

function AlreadyDone({ label, backLabel }: { label: string; backLabel: string }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Check className="size-7" />
          </span>
          <p className="text-sm text-muted-foreground">{label}</p>
          <Button asChild><Link href="/app">{backLabel}</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
