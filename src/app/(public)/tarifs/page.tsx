import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFcfa } from "@/lib/utils";
import { getPricing } from "@/features/settings/queries";

export const metadata = { title: "Tarifs" };

export default async function TarifsPage() {
  const pricing = await getPricing();

  return (
    <div className="container py-14">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold md:text-4xl">Des tarifs simples et clairs</h1>
        <p className="mt-3 text-muted-foreground">
          L&apos;inscription est gratuite. Vous ne payez que pour débloquer les
          fonctionnalités qui vous font gagner du temps.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-5 md:grid-cols-2">
        <PlanCard
          title="Candidate — Activation"
          price={pricing.activationCandidate}
          subtitle="Paiement unique"
          features={[
            "Profil visible par les employeurs",
            "Candidatures illimitées",
            "Badge « profil actif »",
            "Notifications en temps réel",
          ]}
        />
        <PlanCard
          highlight
          title="Employeur — Premium"
          price={pricing.premiumEmployeur}
          subtitle="Accès premium"
          features={[
            "Recherche avancée de candidates",
            "Coordonnées et contact direct",
            "Mise en avant de vos offres",
            "Support prioritaire",
          ]}
        />
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Paiement par Mobile Money : Orange Money, MTN MoMo, Moov Money, Wave.
      </p>
    </div>
  );
}

function PlanCard({
  title,
  price,
  subtitle,
  features,
  highlight,
}: {
  title: string;
  price: number;
  subtitle: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary ring-1 ring-primary" : undefined}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-primary">{formatFcfa(price)}</span>
          <span className="text-sm text-muted-foreground">{subtitle}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Button asChild className="w-full">
          <Link href="/connexion">Commencer</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
