"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Mail, Phone, Search, Briefcase, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { emailSchema, phoneSchema } from "@/features/auth/schemas";
import { GoogleButton } from "@/features/auth/google-button";
import { toE164Ci, cn, ageFromDob } from "@/lib/utils";
import type { UserRole } from "@/lib/supabase/database.types";

/**
 * Connexion / inscription par CODE à usage unique envoyé par e-mail (OTP, sans
 * mot de passe) + Google. Deux étapes : saisie de l'e-mail (et du profil en
 * inscription) → saisie du code à 6 chiffres.
 */
export function EmailAuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations();
  const redirect = params.get("redirect") ?? "/app";
  const roleParam = params.get("role");
  const { toast } = useToast();
  const supabase = createClient();

  const [step, setStep] = useState<"form" | "code">("form");
  const [role, setRole] = useState<UserRole>(roleParam === "candidate" ? "candidate" : "employer");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [dob, setDob] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date maximale = il y a 18 ans (les nounous sont des adultes).
  const maxDob = new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10);
  const normalizedEmail = () => email.trim().toLowerCase();

  function destForRole(r?: string | null) {
    if (!r) return "/onboarding";
    if (r === "admin") return "/admin";
    return redirect.startsWith("/") ? redirect : "/app";
  }

  /** Étape 1 : validation + envoi du code par e-mail. */
  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!emailSchema.safeParse({ email: normalizedEmail() }).success) {
      setError(t("auth.errInvalidEmail"));
      return;
    }

    // Champs de profil requis à l'inscription (le téléphone alimente le profil).
    let phoneMeta: string | undefined;
    if (mode === "register") {
      if (prenom.trim().length < 2 || nom.trim().length < 2) {
        setError(t("auth.errNameRequired"));
        return;
      }
      if (!phoneSchema.safeParse({ phone: phoneInput }).success) {
        setError(t("auth.errInvalidNumber"));
        return;
      }
      const e164 = toE164Ci(phoneInput);
      if (!e164) {
        setError(t("auth.errInvalidNumber"));
        return;
      }
      const age = ageFromDob(dob);
      if (age === null || age < 18) {
        setError(t("auth.errAge"));
        return;
      }
      phoneMeta = e164.replace(/^\+/, "");
    }

    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: normalizedEmail(),
      options:
        mode === "register"
          ? { shouldCreateUser: true, data: { phone: phoneMeta } }
          : { shouldCreateUser: false },
    });
    setLoading(false);

    if (err) {
      setError(mode === "login" ? t("auth.errNoAccount") : t("auth.errSendCode"));
      return;
    }
    setStep("code");
    setCode("");
    toast(t("auth.codeSent"), "success");
  }

  /** Étape 2 : vérification du code → session, puis complétion du profil. */
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const token = code.replace(/\D/g, "");
    // La longueur du code dépend du réglage Supabase (« Email OTP Length », 6 à 10).
    if (!/^\d{6,10}$/u.test(token)) {
      setError(t("auth.errCode"));
      return;
    }

    setLoading(true);
    const { data, error: err } = await supabase.auth.verifyOtp({
      email: normalizedEmail(),
      token,
      type: "email",
    });
    if (err || !data.user) {
      setLoading(false);
      setError(t("auth.errCodeInvalid"));
      return;
    }

    // -------- Inscription : compléter le profil créé par le trigger --------
    if (mode === "register") {
      const e164 = toE164Ci(phoneInput);
      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          prenom: prenom.trim(),
          nom: nom.trim(),
          role,
          phone: e164 ? e164.replace(/^\+/, "") : undefined,
          date_naissance: dob,
        })
        .eq("id", data.user.id);
      if (upErr) {
        setLoading(false);
        setError(upErr.code === "23505" ? t("auth.errPhoneTaken") : t("auth.errSignUp"));
        return;
      }
      if (role === "candidate") await supabase.from("candidate_profiles").upsert({ user_id: data.user.id });
      else await supabase.from("employer_profiles").upsert({ user_id: data.user.id });
      setLoading(false);
      toast(t("auth.toastAccountCreated"), "success");
      router.replace(redirect.startsWith("/") ? redirect : "/app");
      router.refresh();
      return;
    }

    // -------- Connexion --------
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    setLoading(false);
    router.replace(destForRole(profile?.role));
    router.refresh();
  }

  async function resend() {
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: normalizedEmail(),
      options: mode === "register" ? { shouldCreateUser: true } : { shouldCreateUser: false },
    });
    setLoading(false);
    if (err) setError(t("auth.errSendCode"));
    else toast(t("auth.codeResent"), "success");
  }

  // ---------------- Étape 2 : saisie du code ----------------
  if (step === "code") {
    return (
      <form onSubmit={verify} className="space-y-4">
        <div className="space-y-1.5 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <KeyRound className="size-7" />
          </span>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t("auth.codeTitle")}</h1>
          <p className="text-base text-muted-foreground">{t("auth.codeSubtitle", { email: normalizedEmail() })}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="code" className="text-base">{t("auth.codeLabel")}</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            placeholder="••••••"
            className="h-14 text-center text-2xl font-bold tracking-[0.3em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
            autoFocus
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" size="lg" className="w-full text-base" disabled={loading || code.replace(/\D/g, "").length < 6}>
          {loading ? <Spinner className="text-primary-foreground" /> : t("auth.codeSubmit")}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button type="button" onClick={() => { setStep("form"); setError(null); }} className="font-medium text-muted-foreground hover:underline">
            {t("auth.codeChangeEmail")}
          </button>
          <button type="button" onClick={resend} disabled={loading} className="font-medium text-primary hover:underline disabled:opacity-50">
            {t("auth.codeResend")}
          </button>
        </div>
      </form>
    );
  }

  // ---------------- Étape 1 : e-mail (+ profil en inscription) ----------------
  return (
    <div className="space-y-4">
      <form onSubmit={sendCode} className="space-y-4">
        <div className="space-y-1.5 text-center">
          <h1 className="text-2xl font-extrabold sm:text-3xl">
            {mode === "register" ? t("auth.registerTitle") : t("auth.welcome")}
          </h1>
          <p className="text-base text-muted-foreground">
            {mode === "register" ? t("auth.registerSubtitle") : t("auth.welcomeSubtitle")}
          </p>
        </div>

        {mode === "register" && (
          <>
            <div className="space-y-2">
              <Label className="text-base">{t("auth.iAm")}</Label>
              <div className="grid grid-cols-2 gap-2">
                <RoleChip active={role === "employer"} onClick={() => setRole("employer")} icon={<Search className="size-5" />} label={t("auth.family")} />
                <RoleChip active={role === "candidate"} onClick={() => setRole("candidate")} icon={<Briefcase className="size-5" />} label={t("auth.nanny")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="prenom" className="text-base">{t("auth.firstName")}</Label>
                <Input id="prenom" className="h-12 text-base" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom" className="text-base">{t("auth.lastName")}</Label>
                <Input id="nom" className="h-12 text-base" value={nom} onChange={(e) => setNom(e.target.value)} />
              </div>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-base">{t("auth.email")}</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder={t("auth.emailPlaceholder")} className="h-12 pl-11 text-base" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        {mode === "register" && (
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base">{t("auth.phone")}</Label>
            <div className="flex items-center gap-2">
              <span className="flex h-12 items-center rounded-2xl border border-input bg-secondary px-3.5 text-base font-medium text-muted-foreground">+225</span>
              <div className="relative flex-1">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input id="phone" inputMode="numeric" autoComplete="tel" placeholder={t("auth.phonePlaceholder")} className="h-12 pl-11 text-base" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {mode === "register" && (
          <div className="space-y-2">
            <Label htmlFor="dob" className="text-base">{t("auth.dob")}</Label>
            <Input id="dob" type="date" max={maxDob} className="h-12 text-base" value={dob} onChange={(e) => setDob(e.target.value)} />
            <p className="text-xs text-muted-foreground">{t("auth.dobHint")}</p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" size="lg" className="w-full text-base" disabled={loading}>
          {loading ? <Spinner className="text-primary-foreground" /> : t("auth.sendCode")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">{t("auth.otpHint")}</p>
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{t("auth.or")}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton />
    </div>
  );
}

function RoleChip({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-base font-medium transition-colors",
        active ? "border-primary bg-primary-soft text-primary" : "border-border bg-background text-muted-foreground",
      )}
    >
      {icon} {label}
    </button>
  );
}
