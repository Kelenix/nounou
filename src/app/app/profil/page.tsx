import Link from "next/link";
import { Pencil, MapPin, Briefcase, Sparkles, Star, ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRatingSummary } from "@/features/ratings/queries";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/app/verification-badge";
import { RatingStars } from "@/components/app/rating-stars";
import { formatFcfa, formatPhoneCi } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations();
  return { title: t("profile.metaTitle") };
}

export default async function ProfilPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const rating = await getRatingSummary(profile.id);
  const t = await getTranslations();

  const { data: candidate } =
    profile.role === "candidate"
      ? await supabase.from("candidate_profiles").select("*").eq("user_id", profile.id).maybeSingle()
      : { data: null };
  const { data: employer } =
    profile.role === "employer"
      ? await supabase.from("employer_profiles").select("*").eq("user_id", profile.id).maybeSingle()
      : { data: null };

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <Avatar src={profile.photo_url} nom={profile.nom} prenom={profile.prenom} className="size-20" />
            <div className="flex-1">
              <h1 className="text-lg font-extrabold leading-tight">
                {profile.prenom} {profile.nom}
              </h1>
              {(profile.ville || profile.commune) && (
                <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {[profile.commune, profile.ville].filter(Boolean).join(", ")}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">{formatPhoneCi(profile.phone)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <VerificationBadge level={profile.verification_level} />
                <Badge className="bg-primary-soft text-primary">
                  {profile.role === "candidate" ? t("roles.candidate") : t("roles.employer")}
                </Badge>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <RatingStars value={rating.average} count={rating.count} />
          </div>
          <Button asChild variant="secondary" className="mt-4 w-full">
            <Link href="/app/profil/modifier">
              <Pencil className="size-4" /> {t("profile.edit")}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {profile.role === "candidate" && candidate && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <SectionTitle icon={<Sparkles className="size-4" />} title={t("profile.candidateTitle")} />
            {candidate.services.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {candidate.services.map((s) => (
                  <Badge key={s} className="bg-secondary text-foreground">
                    {t(`services.${s}`)}
                  </Badge>
                ))}
              </div>
            )}
            <InfoRow label={t("profile.experience")} value={t("card.years", { years: candidate.experience_annees })} />
            <InfoRow label={t("profile.availability")} value={candidate.disponibilite ?? "—"} />
            <InfoRow label={t("profile.fullTime")} value={candidate.temps_plein ? t("profile.yes") : t("profile.no")} />
            {candidate.salaire_souhaite != null && (
              <InfoRow label={t("profile.desiredSalary")} value={formatFcfa(candidate.salaire_souhaite)} />
            )}
            {candidate.description && (
              <p className="text-sm text-muted-foreground">{candidate.description}</p>
            )}
            {!candidate.is_active_paid && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                <Star className="size-4 shrink-0" />
                {t("profile.notActivated")}
                <Link href="/app/paiement" className="ml-auto font-semibold underline">{t("profile.activate")}</Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {profile.role === "employer" && employer && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <SectionTitle icon={<Briefcase className="size-4" />} title={t("profile.employerTitle")} />
            <InfoRow label={t("profile.needType")} value={employer.type_besoin ?? "—"} />
            <InfoRow label={t("profile.householdSize")} value={employer.nb_personnes_foyer?.toString() ?? "—"} />
            {employer.description && (
              <p className="text-sm text-muted-foreground">{employer.description}</p>
            )}
            <Badge className={employer.is_premium ? "bg-primary-soft text-primary" : "bg-secondary text-muted-foreground"}>
              {employer.is_premium ? t("profile.premium") : t("profile.free")}
            </Badge>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Button asChild variant="ghost" className="w-full justify-start text-muted-foreground">
          <Link href="/app/signalements">
            <ShieldAlert className="size-4" /> {t("profile.myReports")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
        {icon}
      </span>
      <h2 className="font-bold">{title}</h2>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
