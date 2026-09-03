"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MapPin, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { APPLICATION_STATUS_META } from "@/lib/constants";
import { RatingForm } from "@/features/ratings/rating-form";
import type { ApplicationStatus, OfferRow } from "@/lib/supabase/database.types";

export type CandidateApplication = {
  id: string;
  status: ApplicationStatus;
  offer: Pick<OfferRow, "id" | "titre" | "type_service" | "ville" | "commune"> | null;
  rating?: {
    candidateId: string;
    employerId: string;
    employerName: string;
    alreadyRated: boolean;
  } | null;
};

export function CandidateApplicationItem({ application }: { application: CandidateApplication }) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const t = useTranslations();
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [loading, setLoading] = useState(false);
  const offer = application.offer;
  const meta = APPLICATION_STATUS_META[status];
  const canCancel = status === "en_attente" || status === "consultee";

  async function cancel() {
    setLoading(true);
    const { error } = await supabase.from("applications").update({ status: "annulee" }).eq("id", application.id);
    setLoading(false);
    if (error) {
      toast(t("applications.cancelFailed"), "error");
      return;
    }
    setStatus("annulee");
    toast(t("applications.cancelled"), "success");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <Link href={offer ? `/app/offres/${offer.id}` : "#"} className="font-bold hover:underline">
          {offer?.titre ?? t("applications.offerDeleted")}
        </Link>
        <Badge className={meta.className}>{t(`applicationStatus.${status}`)}</Badge>
      </div>
      {offer && (
        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
          <span>{t(`services.${offer.type_service}`)}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {[offer.commune, offer.ville].filter(Boolean).join(", ")}
          </span>
        </p>
      )}
      {canCancel && (
        <Button variant="ghost" size="sm" className="mt-2 text-muted-foreground" onClick={cancel} disabled={loading}>
          <X className="size-4" /> {t("applications.cancelMine")}
        </Button>
      )}

      {status === "acceptee" && application.rating && (
        <div className="mt-3">
          <RatingForm
            fromUser={application.rating.candidateId}
            toUser={application.rating.employerId}
            roleContext="candidate_rates_employer"
            targetName={application.rating.employerName}
            alreadyRated={application.rating.alreadyRated}
          />
        </div>
      )}
    </div>
  );
}
