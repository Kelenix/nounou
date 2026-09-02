"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Briefcase, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { Logo } from "@/components/brand/logo";
import { AvatarUpload } from "@/features/profiles/avatar-upload";
import { VILLES_CI, COMMUNES_ABIDJAN } from "@/lib/constants";
import type { ProfileRow, UserRole } from "@/lib/supabase/database.types";

export function OnboardingForm({ profile }: { profile: ProfileRow }) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [step, setStep] = useState<"infos" | "role">("infos");
  const [photoUrl, setPhotoUrl] = useState<string | null>(profile.photo_url);
  const [prenom, setPrenom] = useState(profile.prenom ?? "");
  const [nom, setNom] = useState(profile.nom ?? "");
  const [ville, setVille] = useState(profile.ville ?? "Abidjan");
  const [commune, setCommune] = useState(profile.commune ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goToRole(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (prenom.trim().length < 2 || nom.trim().length < 2) {
      setError("Renseignez votre nom et prénom.");
      return;
    }
    if (!ville) {
      setError("Choisissez votre ville.");
      return;
    }
    setStep("role");
  }

  async function chooseRole(role: UserRole) {
    setLoading(true);
    setError(null);

    const { error: upErr } = await supabase
      .from("profiles")
      .update({
        prenom: prenom.trim(),
        nom: nom.trim(),
        ville,
        commune: commune.trim() || null,
        photo_url: photoUrl,
        role,
      })
      .eq("id", profile.id);

    if (upErr) {
      setLoading(false);
      setError("Une erreur est survenue. Réessayez.");
      return;
    }

    // Crée l'enregistrement de profil spécifique au rôle (idempotent).
    if (role === "candidate") {
      await supabase.from("candidate_profiles").upsert({ user_id: profile.id });
    } else if (role === "employer") {
      await supabase.from("employer_profiles").upsert({ user_id: profile.id });
    }

    toast("Bienvenue sur J'ai ma nounou !", "success");
    router.replace("/app");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <div className="container flex flex-1 flex-col py-8">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
          {step === "infos" ? (
            <form onSubmit={goToRole} className="space-y-5">
              <div className="text-center">
                <h1 className="text-xl font-extrabold">Faisons connaissance</h1>
                <p className="text-sm text-muted-foreground">
                  Ces informations rassurent les autres membres.
                </p>
              </div>

              <AvatarUpload
                userId={profile.id}
                value={photoUrl}
                nom={nom}
                prenom={prenom}
                onChange={setPhotoUrl}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Select id="ville" value={ville} onChange={(e) => setVille(e.target.value)}>
                  {VILLES_CI.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commune">Commune / quartier</Label>
                {ville === "Abidjan" ? (
                  <Select id="commune" value={commune} onChange={(e) => setCommune(e.target.value)}>
                    <option value="">Sélectionner…</option>
                    {COMMUNES_ABIDJAN.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id="commune"
                    placeholder="Votre commune ou quartier"
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                  />
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full">
                Continuer <ArrowRight className="size-4" />
              </Button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-xl font-extrabold">Que recherchez-vous ?</h1>
                <p className="text-sm text-muted-foreground">
                  Vous pourrez compléter votre profil ensuite.
                </p>
              </div>

              <div className="space-y-3">
                <RoleCard
                  icon={<Search className="size-6" />}
                  title="Je recherche un emploi"
                  subtitle="Je suis une aide à domicile (candidate)"
                  onClick={() => chooseRole("candidate")}
                  disabled={loading}
                />
                <RoleCard
                  icon={<Briefcase className="size-6" />}
                  title="Je recherche une personne"
                  subtitle="Je suis une famille / un employeur"
                  onClick={() => chooseRole("employer")}
                  disabled={loading}
                />
              </div>

              {loading && (
                <div className="flex justify-center">
                  <Spinner />
                </div>
              )}
              {error && <p className="text-center text-sm text-destructive">{error}</p>}

              <button
                type="button"
                onClick={() => setStep("infos")}
                className="w-full text-center text-sm text-muted-foreground"
              >
                Revenir aux informations
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  subtitle,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-4 rounded-2xl border border-border bg-background p-4 text-left transition-colors hover:border-primary hover:bg-primary-soft/40 disabled:opacity-50"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-muted-foreground">{subtitle}</span>
      </span>
      <ArrowRight className="size-5 text-muted-foreground" />
    </button>
  );
}
