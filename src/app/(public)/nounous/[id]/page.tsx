import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Briefcase, Clock, Sparkles, MessageCircle, LogIn, ArrowLeft, CalendarDays } from "lucide-react";
import { getPublicProvider } from "@/features/catalog/queries";
import { ProviderPhoto } from "@/features/catalog/provider-photo";
import { getCurrentProfile } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";
import { VerificationBadge } from "@/components/app/verification-badge";
import { RatingStars } from "@/components/app/rating-stars";
import { formatFcfa } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("nounouDetail.metaTitle") };
}

export default async function PublicProviderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getPublicProvider(id);
  if (!item) notFound();

  const viewer = await getCurrentProfile();
  const t = await getTranslations();
  const { profile, candidate, rating, createdAt } = item;
  const name = `${profile.prenom ?? ""} ${profile.nom ?? ""}`.trim() || t("card.defaultName");

  return (
    <div className="container max-w-3xl py-8 lg:py-12">
      <Link href="/nounous" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("nounouDetail.back")}
      </Link>

      <Card className="overflow-hidden">
        <div className="grid gap-0 sm:grid-cols-[minmax(0,320px)_1fr]">
          {/* Grande photo */}
          <div className="relative aspect-square min-h-56 w-full sm:aspect-auto">
            <ProviderPhoto
              src={profile.photo_url}
              name={name}
              seed={profile.id}
              initialsClassName="size-28 text-4xl"
            />
          </div>

          {/* Infos principales */}
          <CardContent className="flex flex-col justify-center gap-4 p-6">
            <div>
              <h1 className="text-2xl font-extrabold">{name}</h1>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                {[profile.commune, profile.ville].filter(Boolean).join(", ") || t("card.country")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <RatingStars value={rating.average} count={rating.count} size="md" />
              <VerificationBadge level={profile.verification_level} />
            </div>

            {/* Faits clés en pastilles pour équilibrer le panneau */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground">
                <Briefcase className="size-3.5 text-primary" />
                {t("nounouDetail.experienceYears", { years: candidate.experience_annees })}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground">
                <Clock className="size-3.5 text-primary" />
                {candidate.disponibilite || (candidate.temps_plein ? t("nounouDetail.fullTime") : t("nounouDetail.partTime"))}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground">
                <CalendarDays className="size-3.5 text-primary" />
                {t("nounouDetail.memberSince", { year: new Date(createdAt).getFullYear() })}
              </span>
            </div>

            {candidate.salaire_souhaite != null && (
              <div className="flex items-baseline gap-1.5 rounded-2xl border border-primary/20 bg-primary-soft/40 px-4 py-3">
                <span className="text-2xl font-extrabold text-primary">{formatFcfa(candidate.salaire_souhaite)}</span>
                <span className="text-sm font-medium text-muted-foreground">{t("nounouDetail.perMonth")}</span>
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      <Card className="mt-5">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-primary"><Sparkles className="size-4" /></span>
            <h2 className="font-bold">{t("nounouDetail.servicesExp")}</h2>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("nounouDetail.servicesOffered")}</p>
            <div className="flex flex-wrap gap-2">
              {candidate.services.map((s) => (
                <Badge key={s} className="bg-primary-soft text-primary">{t(`services.${s}`)}</Badge>
              ))}
            </div>
          </div>

          {candidate.competences.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("nounouDetail.skills")}</p>
              <div className="flex flex-wrap gap-2">
                {candidate.competences.map((c) => (
                  <Badge key={c} className="bg-secondary text-foreground">{c}</Badge>
                ))}
              </div>
            </div>
          )}

          {candidate.description && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("nounouDetail.about")}</p>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{candidate.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CTA contact — connexion requise uniquement pour agir */}
      <div className="mt-5">
        {viewer ? (
          <Button asChild size="lg" className="w-full">
            <Link href={`/app/candidates/${id}`}>
              <MessageCircle className="size-5" /> {t("nounouDetail.contact", { name: profile.prenom ?? "" })}
            </Link>
          </Button>
        ) : (
          <Card className="border-primary/30 bg-primary-soft/30">
            <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t("nounouDetail.loginToContact", { name: profile.prenom ?? "" })}
              </p>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                <Button asChild size="lg">
                  <Link href={`/connexion?redirect=/app/candidates/${id}`}>
                    <LogIn className="size-5" /> {t("nounouDetail.login")}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href={`/inscription?redirect=/app/candidates/${id}`}>{t("nounouDetail.register")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
