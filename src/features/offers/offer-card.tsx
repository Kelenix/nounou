import Link from "next/link";
import { MapPin, Clock, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SERVICE_LABELS } from "@/lib/constants";
import { formatFcfa } from "@/lib/utils";
import type { OfferRow } from "@/lib/supabase/database.types";

export function OfferCard({
  offer,
  basePath = "/app/offres",
}: {
  offer: OfferRow;
  basePath?: string;
}) {
  return (
    <Link
      href={`${basePath}/${offer.id}`}
      className="block rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold leading-tight">{offer.titre}</h3>
        {offer.salaire ? (
          <span className="shrink-0 text-sm font-bold text-primary">
            {formatFcfa(offer.salaire)}
          </span>
        ) : null}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <BadgeCheck className="size-3.5 text-primary" />
          {SERVICE_LABELS[offer.type_service]}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" />
          {offer.commune ? `${offer.commune}, ` : ""}
          {offer.ville}
        </span>
        {offer.horaires ? (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {offer.horaires}
          </span>
        ) : null}
      </div>
      {offer.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {offer.description}
        </p>
      ) : null}
      {offer.status === "close" && (
        <Badge className="mt-2 bg-muted text-muted-foreground">Clôturée</Badge>
      )}
    </Link>
  );
}
