import Link from "next/link";
import { MapPin, Briefcase } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/app/verification-badge";
import type {
  PublicProfileRow,
  CandidateProfileRow,
} from "@/lib/supabase/database.types";

export type CandidateListItem = {
  profile: Pick<
    PublicProfileRow,
    "id" | "nom" | "prenom" | "photo_url" | "ville" | "commune" | "verification_level" | "age"
  >;
  candidate: Pick<CandidateProfileRow, "services" | "experience_annees" | "temps_plein" | "description">;
};

export async function CandidateCard({ item }: { item: CandidateListItem }) {
  const { profile, candidate } = item;
  const t = await getTranslations();
  return (
    <Link
      href={`/app/candidates/${profile.id}`}
      className="block rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <Avatar src={profile.photo_url} nom={profile.nom} prenom={profile.prenom} className="size-14" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold leading-tight">
              {`${profile.prenom ?? ""} ${profile.nom ?? ""}`.trim() || t("roles.candidate")}
            </h3>
          </div>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {[profile.commune, profile.ville].filter(Boolean).join(", ") || "—"}
            {profile.age != null && ` · ${t("card.age", { age: profile.age })}`}
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Briefcase className="size-3.5" />
            {t("nounouDetail.experienceYears", { years: candidate.experience_annees })} ·{" "}
            {candidate.temps_plein ? t("nounouDetail.fullTime") : t("nounouDetail.partTime")}
          </p>
        </div>
      </div>
      {candidate.services.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {candidate.services.slice(0, 4).map((s) => (
            <Badge key={s} className="bg-secondary text-foreground">
              {t(`services.${s}`)}
            </Badge>
          ))}
        </div>
      )}
      <div className="mt-3">
        <VerificationBadge level={profile.verification_level} />
      </div>
    </Link>
  );
}
