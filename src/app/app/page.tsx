import Link from "next/link";
import {
  PlusCircle,
  Search,
  FileText,
  Sparkles,
  CreditCard,
  Users,
  ArrowRight,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OfferCard } from "@/features/offers/offer-card";
import type { OfferRow } from "@/lib/supabase/database.types";

export const metadata = { title: "Accueil" };

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const greeting = (
    <div className="animate-fade-up">
      <p className="text-sm text-muted-foreground">Bonjour</p>
      <h1 className="text-2xl font-extrabold tracking-tight">{profile.prenom ?? "Bienvenue"}</h1>
    </div>
  );

  if (profile.role === "candidate") {
    const { data: cand } = await supabase
      .from("candidate_profiles")
      .select("is_active_paid")
      .eq("user_id", profile.id)
      .maybeSingle();
    const { count: appsCount } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("candidate_id", profile.id);
    const { data: recos } = await supabase
      .from("offers")
      .select("*")
      .eq("status", "active")
      .eq("ville", profile.ville ?? "")
      .order("created_at", { ascending: false })
      .limit(6);

    const isPaid = cand?.is_active_paid ?? false;

    return (
      <div className="space-y-6">
        {greeting}

        {!isPaid && (
          <Card className="animate-fade-up overflow-hidden border-primary/30 bg-gradient-to-tr from-primary-soft/60 to-background">
            <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Sparkles className="size-6" />
              </span>
              <div className="flex-1">
                <p className="font-bold">Activez votre profil</p>
                <p className="text-sm text-muted-foreground">
                  Soyez visible des familles et postulez sans limite.
                </p>
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/app/paiement">Activer</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <QuickAction href="/app/recherche" icon={<Search className="size-5" />} label="Voir les offres" />
          <QuickAction href="/app/candidatures" icon={<FileText className="size-5" />} label={`Mes candidatures${appsCount ? ` (${appsCount})` : ""}`} />
        </div>

        <section>
          <SectionHeader title={`Offres près de vous${profile.ville ? ` · ${profile.ville}` : ""}`} href="/app/recherche" />
          <OffersGrid offers={recos ?? []} emptyLabel="Aucune offre pour le moment dans votre ville." />
        </section>
      </div>
    );
  }

  if (profile.role === "employer") {
    const { data: emp } = await supabase
      .from("employer_profiles")
      .select("is_premium")
      .eq("user_id", profile.id)
      .maybeSingle();
    const { data: myOffers } = await supabase
      .from("offers")
      .select("*")
      .eq("employer_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(6);
    const { count: receivedCount } = await supabase
      .from("applications")
      .select("id, offers!inner(employer_id)", { count: "exact", head: true })
      .eq("offers.employer_id", profile.id);

    const isPremium = emp?.is_premium ?? false;

    return (
      <div className="space-y-6">
        {greeting}

        {!isPremium && (
          <Card className="animate-fade-up overflow-hidden border-primary/30 bg-gradient-to-tr from-primary-soft/60 to-background">
            <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <CreditCard className="size-6" />
              </span>
              <div className="flex-1">
                <p className="font-bold">Passez en Premium</p>
                <p className="text-sm text-muted-foreground">
                  Recherche avancée et contact direct des candidates.
                </p>
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/app/paiement">Découvrir</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <QuickAction href="/app/offres/nouvelle" icon={<PlusCircle className="size-5" />} label="Publier une offre" primary />
          <QuickAction href="/app/recherche" icon={<Users className="size-5" />} label="Chercher une nounou" />
          <QuickAction href="/app/candidatures" icon={<FileText className="size-5" />} label={`Candidatures${receivedCount ? ` (${receivedCount})` : ""}`} />
          <QuickAction href="/app/offres" icon={<FileText className="size-5" />} label="Mes offres" />
        </div>

        <section>
          <SectionHeader title="Mes offres récentes" href="/app/offres" />
          <OffersGrid
            offers={myOffers ?? []}
            emptyLabel="Vous n'avez pas encore publié d'offre."
            emptyAction={{ href: "/app/offres/nouvelle", label: "Publier ma première offre" }}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-muted-foreground">Vous êtes administrateur.</p>
      <Button asChild className="mt-4">
        <Link href="/admin">Ouvrir le back-office</Link>
      </Button>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  primary,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 ${
        primary ? "border-primary/40 bg-primary-soft/40" : "border-border bg-card"
      }`}
    >
      <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-soft text-primary transition-transform duration-300 group-hover:scale-110">
        {icon}
      </span>
      <span className="text-sm font-semibold leading-tight">{label}</span>
    </Link>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-bold">{title}</h2>
      <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2">
        Voir tout <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function OffersGrid({
  offers,
  emptyLabel,
  emptyAction,
}: {
  offers: OfferRow[];
  emptyLabel: string;
  emptyAction?: { href: string; label: string };
}) {
  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <Badge className="bg-secondary text-muted-foreground">Rien pour l&apos;instant</Badge>
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
          {emptyAction && (
            <Button asChild size="sm">
              <Link href={emptyAction.href}>{emptyAction.label}</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {offers.map((o) => (
        <OfferCard key={o.id} offer={o} />
      ))}
    </div>
  );
}
