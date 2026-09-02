import Link from "next/link";
import { Check, Sparkles, CreditCard } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPricing } from "@/features/settings/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PayForm } from "@/features/payments/pay-form";
import { formatFcfa } from "@/lib/utils";
import type { PaymentType } from "@/lib/supabase/database.types";

export const metadata = { title: "Paiement" };

export default async function PaiementPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const pricing = await getPricing();

  if (profile.role === "candidate") {
    const { data: cand } = await supabase
      .from("candidate_profiles")
      .select("is_active_paid")
      .eq("user_id", profile.id)
      .maybeSingle();
    if (cand?.is_active_paid) return <AlreadyDone label="Votre profil est déjà activé." />;
    return (
      <Checkout
        type="activation_candidate"
        title="Activer mon profil candidate"
        montant={pricing.activationCandidate}
        icon={<Sparkles className="size-6" />}
        features={[
          "Votre profil devient visible des employeurs",
          "Candidatures illimitées",
          "Badge « profil actif »",
        ]}
        phone={profile.phone}
      />
    );
  }

  if (profile.role === "employer") {
    const { data: emp } = await supabase
      .from("employer_profiles")
      .select("is_premium")
      .eq("user_id", profile.id)
      .maybeSingle();
    if (emp?.is_premium) return <AlreadyDone label="Votre accès premium est déjà actif." />;
    return (
      <Checkout
        type="premium_employeur"
        title="Passer en Premium"
        montant={pricing.premiumEmployeur}
        icon={<CreditCard className="size-6" />}
        features={[
          "Recherche avancée de candidates",
          "Contact direct des candidates",
          "Mise en avant de vos offres",
        ]}
        phone={profile.phone}
      />
    );
  }

  return <AlreadyDone label="Aucun paiement requis pour ce compte." />;
}

function Checkout({
  type,
  title,
  montant,
  icon,
  features,
  phone,
}: {
  type: PaymentType;
  title: string;
  montant: number;
  icon: React.ReactNode;
  features: string[];
  phone: string;
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

      <PayForm type={type} montant={montant} defaultPhone={phone} />
    </div>
  );
}

function AlreadyDone({ label }: { label: string }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Check className="size-7" />
          </span>
          <p className="text-sm text-muted-foreground">{label}</p>
          <Button asChild><Link href="/app">Retour à l&apos;accueil</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
