import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Clock, BadgeCheck, Home, Send, LogIn, ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatFcfa } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("offreDetail.metaTitle") };
}

export default async function PublicOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getTranslations();

  const { data: offer } = await supabase
    .from("offers")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  if (!offer) notFound();

  const { data: employer } = await supabase
    .from("public_profiles")
    .select("id, nom, prenom, photo_url, ville, commune")
    .eq("id", offer.employer_id)
    .maybeSingle();

  const viewer = await getCurrentProfile();

  return (
    <div className="container max-w-3xl py-8 lg:py-12">
      <Link href="/offres" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("offreDetail.back")}
      </Link>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h1 className="text-2xl font-extrabold leading-tight">{offer.titre}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary-soft text-primary"><BadgeCheck className="size-3" /> {t(`services.${offer.type_service}`)}</Badge>
            {offer.salaire != null && <Badge className="bg-secondary text-foreground">{formatFcfa(offer.salaire)}{t("offreDetail.perMonth")}</Badge>}
            {offer.logee && <Badge className="bg-secondary text-foreground"><Home className="size-3" /> {t("offreDetail.housed")}</Badge>}
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="inline-flex items-center gap-2"><MapPin className="size-4 text-primary" />{[offer.quartier, offer.commune, offer.ville].filter(Boolean).join(", ")}</p>
            {offer.horaires && <p className="inline-flex items-center gap-2"><Clock className="size-4 text-primary" />{offer.horaires}</p>}
          </div>
          {offer.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{offer.description}</p>}
        </CardContent>
      </Card>

      {employer && (
        <Card className="mt-5">
          <CardContent className="flex items-center gap-3 p-4">
            <Avatar src={employer.photo_url} nom={employer.nom} prenom={employer.prenom} className="size-11" />
            <div>
              <p className="text-sm font-semibold">{`${employer.prenom ?? ""} ${employer.nom ?? ""}`.trim() || t("offreDetail.family")}</p>
              <p className="text-xs text-muted-foreground">{[employer.commune, employer.ville].filter(Boolean).join(", ")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-5">
        {viewer ? (
          <Button asChild size="lg" className="w-full">
            <Link href={`/app/offres/${id}`}><Send className="size-5" /> {t("offreDetail.apply")}</Link>
          </Button>
        ) : (
          <Card className="border-primary/30 bg-primary-soft/30">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <p className="text-sm text-muted-foreground">{t("offreDetail.loginToApply")}</p>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                <Button asChild size="lg"><Link href={`/connexion?redirect=/app/offres/${id}`}><LogIn className="size-5" /> {t("offreDetail.login")}</Link></Button>
                <Button asChild size="lg" variant="secondary"><Link href={`/inscription?role=candidate&redirect=/app/offres/${id}`}>{t("offreDetail.register")}</Link></Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
