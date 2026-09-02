import Link from "next/link";
import { MapPin, Briefcase } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge } from "@/components/app/verification-badge";
import { SERVICE_LABELS } from "@/lib/constants";
import type {
  PublicProfileRow,
  CandidateProfileRow,
} from "@/lib/supabase/database.types";

export type CandidateListItem = {
  profile: Pick<
    PublicProfileRow,
    "id" | "nom" | "prenom" | "photo_url" | "ville" | "commune" | "verification_level"
  >;
  candidate: Pick<CandidateProfileRow, "services" | "experience_annees" | "temps_plein" | "description">;
};

export function CandidateCard({ item }: { item: CandidateListItem }) {
  const { profile, candidate } = item;
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
              {`${profile.prenom ?? ""} ${profile.nom ?? ""}`.trim() || "Candidate"}
            </h3>
          </div>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {[profile.commune, profile.ville].filter(Boolean).join(", ") || "—"}
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Briefcase className="size-3.5" />
            {candidate.experience_annees} an(s) d&apos;expérience ·{" "}
            {candidate.temps_plein ? "Temps plein" : "Temps partiel"}
          </p>
        </div>
      </div>
      {candidate.services.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {candidate.services.slice(0, 4).map((s) => (
            <Badge key={s} className="bg-secondary text-foreground">
              {SERVICE_LABELS[s]}
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
