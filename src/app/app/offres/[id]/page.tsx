import { notFound } from "next/navigation";
import { MapPin, Clock, Calendar, BadgeCheck, Home, Users } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ApplyButton } from "@/features/applications/apply-button";
import { OfferStatusToggle } from "@/features/offers/offer-status-toggle";
import {
  EmployerApplicationItem,
  type EmployerApplication,
} from "@/features/applications/employer-application-item";
import { SERVICE_LABELS } from "@/lib/constants";
import { formatFcfa } from "@/lib/utils";
import type { ApplicationStatus, PublicProfileRow } from "@/lib/supabase/database.types";

export const metadata = { title: "Offre" };

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: offer } = await supabase.from("offers").select("*").eq("id", id).maybeSingle();
  if (!offer) notFound();

  const isOwner = offer.employer_id === profile.id;
  if (offer.status === "close" && !isOwner && profile.role !== "admin") notFound();

  // Employeur (auteur de l'offre) pour affichage public.
  const { data: employer } = await supabase
    .from("public_profiles")
    .select("id, nom, prenom, photo_url, ville, commune, verification_level")
    .eq("id", offer.employer_id)
    .maybeSingle();

  // État candidature pour une candidate.
  let existingStatus: ApplicationStatus | null = null;
  let isActivePaid = false;
  if (profile.role === "candidate") {
    const { data: app } = await supabase
      .from("applications")
      .select("status")
      .eq("offer_id", id)
      .eq("candidate_id", profile.id)
      .maybeSingle();
    existingStatus = app?.status ?? null;
    const { data: cand } = await supabase
      .from("candidate_profiles")
      .select("is_active_paid")
      .eq("user_id", profile.id)
      .maybeSingle();
    isActivePaid = cand?.is_active_paid ?? false;
  }

  // Candidatures reçues (propriétaire).
  let applications: EmployerApplication[] = [];
  if (isOwner) {
    const { data: apps } = await supabase
      .from("applications")
      .select("id, status, message, candidate_id")
      .eq("offer_id", id)
      .order("created_at", { ascending: false });

    const rows = apps ?? [];
    const ids = rows.map((a) => a.candidate_id);
    const candidatesById = new Map<string, PublicProfileRow>();
    if (ids.length > 0) {
      const { data: cands } = await supabase
        .from("public_profiles")
        .select("id, nom, prenom, photo_url, ville, commune, role, verification_level, is_active, is_suspended, created_at")
        .in("id", ids);
      for (const c of cands ?? []) candidatesById.set(c.id, c);
    }
    applications = rows.map((a) => ({
      id: a.id,
      status: a.status,
      message: a.message,
      candidate: candidatesById.get(a.candidate_id) ?? null,
    }));
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-extrabold leading-tight">{offer.titre}</h1>
            {offer.status === "close" && (
              <Badge className="bg-muted text-muted-foreground">Clôturée</Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary-soft text-primary">
              <BadgeCheck className="size-3" /> {SERVICE_LABELS[offer.type_service]}
            </Badge>
            {offer.salaire != null && (
              <Badge className="bg-secondary text-foreground">{formatFcfa(offer.salaire)}</Badge>
            )}
            {offer.logee && (
              <Badge className="bg-secondary text-foreground"><Home className="size-3" /> Logée</Badge>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <Row icon={<MapPin className="size-4" />} value={[offer.quartier, offer.commune, offer.ville].filter(Boolean).join(", ")} />
            {offer.horaires && <Row icon={<Clock className="size-4" />} value={offer.horaires} />}
            {offer.date_debut && <Row icon={<Calendar className="size-4" />} value={`Début : ${offer.date_debut}`} />}
            {offer.experience_souhaitee != null && (
              <Row icon={<Users className="size-4" />} value={`Expérience souhaitée : ${offer.experience_souhaitee} an(s)`} />
            )}
          </div>

          {offer.description && (
            <p className="whitespace-pre-line text-sm text-muted-foreground">{offer.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Auteur de l'offre */}
      {employer && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Avatar src={employer.photo_url} nom={employer.nom} prenom={employer.prenom} className="size-11" />
            <div>
              <p className="text-sm font-semibold">
                {`${employer.prenom ?? ""} ${employer.nom ?? ""}`.trim() || "Employeur"}
              </p>
              <p className="text-xs text-muted-foreground">
                {[employer.commune, employer.ville].filter(Boolean).join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions candidate */}
      {profile.role === "candidate" && offer.status === "active" && (
        <ApplyButton
          offerId={offer.id}
          candidateId={profile.id}
          existingStatus={existingStatus}
          isActivePaid={isActivePaid}
        />
      )}

      {/* Gestion propriétaire */}
      {isOwner && (
        <>
          <OfferStatusToggle offerId={offer.id} status={offer.status} />
          <section>
            <h2 className="mb-3 font-bold">
              Candidatures reçues ({applications.length})
            </h2>
            {applications.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Aucune candidature pour le moment.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {applications.map((a) => (
                  <EmployerApplicationItem key={a.id} application={a} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Row({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <span className="text-primary">{icon}</span>
      <span>{value}</span>
    </div>
  );
}
