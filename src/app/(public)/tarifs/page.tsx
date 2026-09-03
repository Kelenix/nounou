import Link from "next/link";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFcfa } from "@/lib/utils";
import { getPricing } from "@/features/settings/queries";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("pricing.metaTitle") };
}

export default async function TarifsPage() {
  const pricing = await getPricing();
  const t = await getTranslations();

  return (
    <div className="container py-14">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold md:text-4xl">{t("pricing.title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("pricing.subtitle")}</p>
      </div>

      <div className="mx-auto mt-10 grid max-w-3xl gap-5 md:grid-cols-2">
        <PlanCard
          title={t("pricing.candidateTitle")}
          price={pricing.activationCandidate}
          subtitle={t("pricing.candidateSubtitle")}
          cta={t("pricing.start")}
          features={[
            t("pricing.candidateFeature1"),
            t("pricing.candidateFeature2"),
            t("pricing.candidateFeature3"),
            t("pricing.candidateFeature4"),
          ]}
        />
        <PlanCard
          highlight
          title={t("pricing.employerTitle")}
          price={pricing.premiumEmployeur}
          subtitle={t("pricing.employerSubtitle")}
          cta={t("pricing.start")}
          features={[
            t("pricing.employerFeature1"),
            t("pricing.employerFeature2"),
            t("pricing.employerFeature3"),
            t("pricing.employerFeature4"),
          ]}
        />
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">{t("pricing.payments")}</p>
    </div>
  );
}

function PlanCard({
  title,
  price,
  subtitle,
  features,
  cta,
  highlight,
}: {
  title: string;
  price: number;
  subtitle: string;
  features: string[];
  cta: string;
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
          <Link href="/connexion">{cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
