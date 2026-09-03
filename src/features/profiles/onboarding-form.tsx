"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Briefcase, ArrowRight, Phone } from "lucide-react";
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
import { phoneSchema } from "@/features/auth/schemas";
import { toE164Ci, formatPhoneCi } from "@/lib/utils";
import type { ProfileRow, UserRole } from "@/lib/supabase/database.types";

export function OnboardingForm({ profile }: { profile: ProfileRow }) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const t = useTranslations();

  const [step, setStep] = useState<"infos" | "role">("infos");
  const [photoUrl, setPhotoUrl] = useState<string | null>(profile.photo_url);
  const [prenom, setPrenom] = useState(profile.prenom ?? "");
  const [nom, setNom] = useState(profile.nom ?? "");
  const [ville, setVille] = useState(profile.ville ?? "Abidjan");
  const [commune, setCommune] = useState(profile.commune ?? "");
  const hasPhone = !!profile.phone;
  const [phoneInput, setPhoneInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goToRole(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (prenom.trim().length < 2 || nom.trim().length < 2) {
      setError(t("onboarding.nameRequired"));
      return;
    }
    if (!ville) {
      setError(t("onboarding.cityRequired"));
      return;
    }
    // Le téléphone est requis (contact) : demandé ici si le compte n'en a pas (Google).
    if (!hasPhone && !toE164Ci(phoneSchema.safeParse({ phone: phoneInput }).success ? phoneInput : "")) {
      setError(t("onboarding.phoneRequired"));
      return;
    }
    setStep("role");
  }

  async function chooseRole(role: UserRole) {
    setLoading(true);
    setError(null);

    const patch: Partial<ProfileRow> = {
      prenom: prenom.trim(),
      nom: nom.trim(),
      ville,
      commune: commune.trim() || null,
      photo_url: photoUrl,
      role,
    };
    // Renseigne le téléphone la première fois (compte Google sans numéro).
    if (!hasPhone) patch.phone = toE164Ci(phoneInput) ?? null;

    const { error: upErr } = await supabase.from("profiles").update(patch).eq("id", profile.id);

    if (upErr) {
      setLoading(false);
      // 23505 = violation d'unicité (numéro déjà utilisé par un autre compte).
      setError(upErr.code === "23505" ? t("onboarding.phoneTaken") : t("onboarding.error"));
      return;
    }

    // Crée l'enregistrement de profil spécifique au rôle (idempotent).
    if (role === "candidate") {
      await supabase.from("candidate_profiles").upsert({ user_id: profile.id });
    } else if (role === "employer") {
      await supabase.from("employer_profiles").upsert({ user_id: profile.id });
    }

    toast(t("onboarding.welcome"), "success");
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
                <h1 className="text-xl font-extrabold">{t("onboarding.getToKnow")}</h1>
                <p className="text-sm text-muted-foreground">
                  {t("onboarding.getToKnowSub")}
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
                  <Label htmlFor="prenom">{t("onboarding.firstName")}</Label>
                  <Input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">{t("onboarding.lastName")}</Label>
                  <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ville">{t("onboarding.city")}</Label>
                <Select id="ville" value={ville} onChange={(e) => setVille(e.target.value)}>
                  {VILLES_CI.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commune">{t("onboarding.communeQuartier")}</Label>
                {ville === "Abidjan" ? (
                  <Select id="commune" value={commune} onChange={(e) => setCommune(e.target.value)}>
                    <option value="">{t("onboarding.select")}</option>
                    {COMMUNES_ABIDJAN.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id="commune"
                    placeholder={t("onboarding.communePlaceholder")}
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("onboarding.phone")}</Label>
                {hasPhone ? (
                  <Input id="phone" value={formatPhoneCi(profile.phone)} disabled />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 items-center rounded-2xl border border-input bg-secondary px-3 text-sm font-medium text-muted-foreground">
                      +225
                    </span>
                    <Input
                      id="phone"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="07 00 00 00 00"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full">
                {t("onboarding.continue")} <ArrowRight className="size-4" />
              </Button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="text-xl font-extrabold">{t("onboarding.whatLooking")}</h1>
                <p className="text-sm text-muted-foreground">
                  {t("onboarding.completeLater")}
                </p>
              </div>

              <div className="space-y-3">
                <RoleCard
                  icon={<Search className="size-6" />}
                  title={t("onboarding.candidateTitle")}
                  subtitle={t("onboarding.candidateSub")}
                  onClick={() => chooseRole("candidate")}
                  disabled={loading}
                />
                <RoleCard
                  icon={<Briefcase className="size-6" />}
                  title={t("onboarding.employerTitle")}
                  subtitle={t("onboarding.employerSub")}
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
                {t("onboarding.backToInfo")}
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
