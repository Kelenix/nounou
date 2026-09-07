import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Carte d'incitation à compléter le profil (masquée à 100 %). */
export async function ProfileCompletenessCard({ percent, missing }: { percent: number; missing: string[] }) {
  if (percent >= 100) return null;
  const t = await getTranslations();
  return (
    <Card className="border-primary/30 bg-primary-soft/30">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold">{t("profile.completeness.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("profile.completeness.subtitle")}</p>
          </div>
          <span className="ml-auto text-lg font-extrabold text-primary">{percent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {missing.map((k) => (
            <span key={k} className="rounded-full bg-background px-2.5 py-1 text-xs text-muted-foreground">
              {t(`profile.completeness.item_${k}`)}
            </span>
          ))}
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href="/app/profil/modifier">
            {t("profile.completeness.cta")} <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
