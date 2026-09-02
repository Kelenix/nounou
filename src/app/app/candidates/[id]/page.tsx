import { notFound } from "next/navigation";
import { MapPin, Briefcase, Clock, Sparkles, Phone, MessageCircle, CalendarDays } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRatingSummary } from "@/features/ratings/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/app/verification-badge";
import { RatingStars } from "@/components/app/rating-stars";
import { ProviderPhoto } from "@/features/catalog/provider-photo";
import { FavoriteButton } from "@/features/candidates/favorite-button";
import { ReportButton } from "@/features/reports/report-button";
import { RatingForm } from "@/features/ratings/rating-form";
import { StartConversationButton } from "@/features/messages/start-conversation-button";
import { SERVICE_LABELS } from "@/lib/constants";
import { formatFcfa, formatPhoneCi } from "@/lib/utils";

export const metadata = { title: "Profil candidate" };

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await requireProfile();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("public_profiles")
    .select("id, nom, prenom, photo_url, ville, commune, verification_level, role, is_suspended, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!profile || profile.role !== "candidate") notFound();

  const { data: candidate } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  const rating = await getRatingSummary(id);

  // Téléphone révélé aux utilisateurs connectés (RPC sécurisée).
  const { data: phone } = await supabase.rpc("candidate_phone", { candidate: id });
  const digits = phone ? phone.replace(/\D/g, "") : "";

  const name = `${profile.prenom ?? ""} ${profile.nom ?? ""}`.trim() || "Candidate";
  const isEmployer = viewer.role === "employer";
  let isFavorite = false;
  let canRate = false;
  let alreadyRated = false;
  if (isEmployer) {
    const { data: fav } = await supabase
      .from("favorites")
      .select("candidate_id")
      .eq("employer_id", viewer.id)
      .eq("candidate_id", id)
      .maybeSingle();
    isFavorite = !!fav;

    // Notation possible après une candidature acceptée de cette candidate.
    const { data: myOffers } = await supabase.from("offers").select("id").eq("employer_id", viewer.id);
    const offerIds = (myOffers ?? []).map((o) => o.id);
    if (offerIds.length > 0) {
      const { data: acc } = await supabase
        .from("applications")
        .select("id")
        .eq("candidate_id", id)
        .eq("status", "acceptee")
        .in("offer_id", offerIds)
        .limit(1);
      canRate = (acc ?? []).length > 0;
    }
    const { data: existing } = await supabase
      .from("ratings")
      .select("id")
      .eq("from_user", viewer.id)
      .eq("to_user", id)
      .eq("role_context", "employer_rates_candidate")
      .maybeSingle();
    alreadyRated = !!existing;
  }

  // Avis reçus (avec commentaire).
  const { data: reviewsRaw } = await supabase
    .from("ratings")
    .select("id, note_moyenne, commentaire, from_user, created_at")
    .eq("to_user", id)
    .not("commentaire", "is", null)
    .order("created_at", { ascending: false })
    .limit(10);
  const reviewerNames = new Map<string, string>();
  const reviewerIds = (reviewsRaw ?? []).map((r) => r.from_user);
  if (reviewerIds.length > 0) {
    const { data: revs } = await supabase.from("public_profiles").select("id, prenom, nom").in("id", reviewerIds);
    for (const r of revs ?? []) reviewerNames.set(r.id, `${r.prenom ?? ""} ${r.nom ?? ""}`.trim() || "Utilisateur");
  }
  const reviews = reviewsRaw ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* En-tête avec grande photo */}
      <Card className="overflow-hidden">
        <div className="grid gap-0 sm:grid-cols-[minmax(0,260px)_1fr]">
          <div className="relative aspect-square min-h-52 w-full sm:aspect-auto">
            <ProviderPhoto src={profile.photo_url} name={name} seed={profile.id} initialsClassName="size-24 text-3xl" />
          </div>
          <CardContent className="flex flex-col justify-center p-5">
            <h1 className="text-xl font-extrabold">{name}</h1>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4" />{[profile.commune, profile.ville].filter(Boolean).join(", ") || "—"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <RatingStars value={rating.average} count={rating.count} size="md" />
              <VerificationBadge level={profile.verification_level} />
            </div>
            {candidate?.salaire_souhaite != null && (
              <div className="mt-3">
                <span className="text-xl font-extrabold text-primary">{formatFcfa(candidate.salaire_souhaite)}</span>
                <span className="text-sm text-muted-foreground"> / mois</span>
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      {/* Contact (réservé aux connectés) */}
      {phone && (
        <Card className="border-primary/30 bg-primary-soft/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Phone className="size-4" /></span>
              <h2 className="font-bold">Contact</h2>
            </div>
            <p className="mt-2 text-lg font-bold tracking-wide">{formatPhoneCi(phone)}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button asChild>
                <a href={`tel:+${digits}`}><Phone className="size-4" /> Appeler</a>
              </Button>
              <Button asChild variant="secondary">
                <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" /> WhatsApp
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Détails */}
      {candidate && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary-soft text-primary"><Sparkles className="size-4" /></span>
              <h2 className="font-bold">Services &amp; compétences</h2>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Services proposés</p>
              <div className="flex flex-wrap gap-2">
                {candidate.services.map((s) => (
                  <Badge key={s} className="bg-primary-soft text-primary">{SERVICE_LABELS[s]}</Badge>
                ))}
              </div>
            </div>

            {candidate.competences.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Compétences</p>
                <div className="flex flex-wrap gap-2">
                  {candidate.competences.map((c) => (
                    <Badge key={c} className="bg-secondary text-foreground">{c}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border/60 pt-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Briefcase className="size-4 text-primary" /> {candidate.experience_annees} an(s) d&apos;expérience</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="size-4 text-primary" /> {candidate.disponibilite || (candidate.temps_plein ? "Temps plein" : "Temps partiel")}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4 text-primary" /> Membre depuis {new Date(profile.created_at).getFullYear()}</span>
            </div>

            {candidate.description && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">À propos</p>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{candidate.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isEmployer && canRate && (
        <RatingForm
          fromUser={viewer.id}
          toUser={id}
          roleContext="employer_rates_candidate"
          targetName={profile.prenom ?? "cette candidate"}
          alreadyRated={alreadyRated}
        />
      )}

      {/* Avis reçus */}
      {reviews.length > 0 && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="font-bold">Avis ({reviews.length})</h2>
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{reviewerNames.get(r.from_user) ?? "Utilisateur"}</span>
                  <RatingStars value={r.note_moyenne} />
                </div>
                {r.commentaire && <p className="mt-1 text-sm text-muted-foreground">« {r.commentaire} »</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {isEmployer && (
        <div className="space-y-2">
          <StartConversationButton employerId={viewer.id} candidateId={id} />
          <FavoriteButton employerId={viewer.id} candidateId={id} initial={isFavorite} />
          <ReportButton reporterId={viewer.id} targetId={id} />
        </div>
      )}
    </div>
  );
}
