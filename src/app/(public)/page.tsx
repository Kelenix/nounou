import Link from "next/link";
import {
  ShieldCheck,
  Star,
  BadgeCheck,
  Sparkles,
  ChefHat,
  Baby,
  Shirt,
  Wind,
  HeartHandshake,
  Home,
  MoreHorizontal,
  ArrowRight,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CatalogSearchBar } from "@/features/catalog/catalog-search-bar";
import { ProviderCard } from "@/features/catalog/provider-card";
import { listPublicProviders, countActiveProviders } from "@/features/catalog/queries";
import type { ServiceType } from "@/lib/supabase/database.types";
import { SERVICE_LABELS } from "@/lib/constants";

const CATEGORIES: { key: ServiceType; icon: typeof Sparkles; color: string }[] = [
  { key: "garde_enfants", icon: Baby, color: "text-primary bg-primary-soft" },
  { key: "menage", icon: Sparkles, color: "text-emerald-600 bg-emerald-50" },
  { key: "cuisine", icon: ChefHat, color: "text-orange-600 bg-orange-50" },
  { key: "assistance_personnes_agees", icon: HeartHandshake, color: "text-rose-600 bg-rose-50" },
  { key: "lessive", icon: Shirt, color: "text-blue-600 bg-blue-50" },
  { key: "repassage", icon: Wind, color: "text-cyan-600 bg-cyan-50" },
  { key: "entretien", icon: Home, color: "text-violet-600 bg-violet-50" },
  { key: "autre", icon: MoreHorizontal, color: "text-slate-600 bg-slate-100" },
];

export default async function HomePage() {
  const providers = await listPublicProviders({}, 8);
  const totalProviders = await countActiveProviders();

  return (
    <>
      {/* ================= HERO + RECHERCHE ================= */}
      <section className="relative flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden bg-gradient-to-b from-primary-soft/70 via-background to-background">
        <div className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute -right-16 bottom-0 size-80 rounded-full bg-emerald-300/30 blur-3xl animate-blob delay-300" />

        <div className="container relative py-20 text-center">
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur animate-fade-up">
            <ShieldCheck className="size-4" /> La confiance avant tout
          </span>
          <h1 className="text-balance text-5xl font-extrabold leading-[1.03] tracking-tight text-foreground animate-fade-up delay-75 sm:text-6xl lg:text-7xl xl:text-8xl">
            Trouvez la nounou{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">idéale</span>{" "}
            près de chez vous
          </h1>
          <p className="mx-auto mt-7 max-w-4xl text-pretty text-xl text-muted-foreground animate-fade-up delay-150 sm:text-2xl">
            Des aides à domicile de confiance partout en Côte d&apos;Ivoire.
            Cherchez, comparez et contactez — sans même créer de compte pour explorer.
          </p>

          <div className="mt-12 animate-fade-up delay-200">
            <CatalogSearchBar />
          </div>

          {/* Statistiques */}
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-3 gap-4 animate-fade-up delay-300">
            <HeroStat value={`${totalProviders}+`} label="Nounous disponibles" />
            <HeroStat value="100%" label="Profils vérifiés" />
            <HeroStat value="Gratuit" label="Inscription" />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-base text-muted-foreground animate-fade-up delay-500">
            <span className="inline-flex items-center gap-2"><BadgeCheck className="size-5 text-primary" /> Profils vérifiés</span>
            <span className="inline-flex items-center gap-2"><Star className="size-5 text-primary" /> Avis réels</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /> Sans engagement</span>
          </div>
        </div>
      </section>

      {/* ================= SERVICES POPULAIRES ================= */}
      <section className="border-t border-border/50 bg-background py-16">
        <div className="container">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Services populaires</h2>
              <p className="mt-1 text-muted-foreground">Choisissez un service pour voir les nounous disponibles.</p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CATEGORIES.slice(0, 4).map(({ key, icon: Icon, color }) => (
              <Link
                key={key}
                href={`/nounous?service=${key}`}
                className="group flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
              >
                <span className={`flex size-14 items-center justify-center rounded-2xl ${color} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="size-7" />
                </span>
                <span className="font-semibold">{SERVICE_LABELS[key]}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= NOUNOUS DISPONIBLES ================= */}
      <section className="bg-secondary/60 py-16">
        <div className="container">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Nounous disponibles</h2>
              <p className="mt-1 text-muted-foreground">Découvrez les prestataires actifs près de chez vous.</p>
            </div>
            <Button asChild variant="secondary" className="shrink-0">
              <Link href="/nounous">Voir tout <ArrowRight className="size-4" /></Link>
            </Button>
          </div>

          {providers.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {providers.map((p) => <ProviderCard key={p.profile.id} item={p} />)}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-border bg-card p-10 text-center">
              <Users className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">Aucune nounou disponible pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* ================= TOUTES LES CATÉGORIES ================= */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Toutes les catégories</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {CATEGORIES.map(({ key, icon: Icon }) => (
              <Link
                key={key}
                href={`/nounous?service=${key}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
              >
                <Icon className="size-4" /> {SERVICE_LABELS[key]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CONFIANCE ================= */}
      <section className="bg-gradient-to-b from-secondary to-background py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Pourquoi nous faire confiance ?</h2>
            <p className="mt-3 text-muted-foreground">La sécurité et la sérénité des familles, notre priorité.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: <BadgeCheck className="size-6" />, title: "Profils vérifiés", text: "Numéro vérifié par SMS et badges de confiance." },
              { icon: <Star className="size-6" />, title: "Avis authentiques", text: "Notations mutuelles après chaque expérience." },
              { icon: <ShieldCheck className="size-6" />, title: "Signalement facile", text: "Un souci ? Signalez-le en un geste, notre équipe veille." },
            ].map((t) => (
              <div key={t.title} className="rounded-3xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">{t.icon}</span>
                <h3 className="mt-4 text-lg font-bold">{t.title}</h3>
                <p className="mt-2 text-muted-foreground">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="pb-24">
        <div className="container">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-tr from-primary to-emerald-600 px-8 py-14 text-center shadow-2xl shadow-primary/20">
            <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10 blur-2xl" />
            <h2 className="relative text-3xl font-extrabold text-primary-foreground md:text-4xl">Vous cherchez du travail ?</h2>
            <p className="relative mx-auto mt-3 max-w-lg text-primary-foreground/90">
              Consultez les offres des familles et postulez en quelques secondes.
            </p>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                <Link href="/offres">Voir les offres d&apos;emploi <ArrowRight className="size-4" /></Link>
              </Button>
              <Button asChild size="lg" className="bg-primary-foreground/10 text-primary-foreground ring-1 ring-white/40 hover:bg-primary-foreground/20">
                <Link href="/inscription?role=candidate">Devenir nounou</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
      <div className="text-2xl font-extrabold text-primary sm:text-3xl">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
