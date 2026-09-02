import Link from "next/link";
import { MapPin, Briefcase, ArrowRight, Star, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProviderPhoto } from "@/features/catalog/provider-photo";
import { SERVICE_LABELS } from "@/lib/constants";
import { formatFcfa } from "@/lib/utils";
import type { ProviderItem } from "@/features/catalog/queries";

export function ProviderCard({ item }: { item: ProviderItem }) {
  const { profile, candidate, rating } = item;
  const name = `${profile.prenom ?? ""} ${profile.nom ?? ""}`.trim() || "Nounou";

  return (
    <Link
      href={`/nounous/${profile.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
    >
      {/* Grande photo */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <ProviderPhoto
          src={profile.photo_url}
          name={name}
          seed={profile.id}
          className="transition-transform duration-500 group-hover:scale-105"
        />

        {/* Note en surimpression */}
        {rating.average != null && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold shadow-sm">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            {rating.average.toFixed(1)}
          </span>
        )}

        {/* Badge vérifié en surimpression */}
        {profile.verification_level !== "phone" && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
            <BadgeCheck className="size-3.5" /> Vérifié
          </span>
        )}

        {/* Tarif en surimpression bas */}
        {candidate.salaire_souhaite != null && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-primary shadow-sm">
            {formatFcfa(candidate.salaire_souhaite)}
            <span className="text-xs font-normal text-muted-foreground">/mois</span>
          </span>
        )}
      </div>

      {/* Infos */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate text-base font-bold">{name}</h3>
        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          {[profile.commune, profile.ville].filter(Boolean).join(", ") || "Côte d'Ivoire"}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {candidate.services.slice(0, 3).map((s) => (
            <Badge key={s} className="bg-primary-soft text-primary">{SERVICE_LABELS[s]}</Badge>
          ))}
          {candidate.services.length > 3 && (
            <Badge className="bg-secondary text-muted-foreground">+{candidate.services.length - 3}</Badge>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Briefcase className="size-3.5" /> {candidate.experience_annees} an(s)
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all group-hover:gap-2">
            Voir <ArrowRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
