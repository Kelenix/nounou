"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Mail, Lock, Phone, Search, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { emailSchema, passwordSchema, phoneSchema } from "@/features/auth/schemas";
import { GoogleButton } from "@/features/auth/google-button";
import { toE164Ci, cn } from "@/lib/utils";
import type { UserRole } from "@/lib/supabase/database.types";

/** Connexion / inscription par email + mot de passe (+ Google). */
export function EmailAuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations();
  const redirect = params.get("redirect") ?? "/app";
  const roleParam = params.get("role");
  const { toast } = useToast();
  const supabase = createClient();

  const [role, setRole] = useState<UserRole>(roleParam === "candidate" ? "candidate" : "employer");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function destForRole(r?: string | null) {
    if (!r) return "/onboarding";
    if (r === "admin") return "/admin";
    return redirect.startsWith("/") ? redirect : "/app";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!emailSchema.safeParse({ email: normalizedEmail }).success) {
      setError(t("auth.errInvalidEmail"));
      return;
    }
    if (!passwordSchema.safeParse({ password }).success) {
      setError(t("auth.errPassword"));
      return;
    }

    // -------- Connexion --------
    if (mode === "login") {
      setLoading(true);
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (err || !data.user) {
        setLoading(false);
        setError(t("auth.errSignIn"));
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
      setLoading(false);
      router.replace(destForRole(profile?.role));
      router.refresh();
      return;
    }

    // -------- Inscription --------
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

    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({ email: normalizedEmail, password });
    if (err || !data.user) {
      setLoading(false);
      setError(err?.message?.toLowerCase().includes("already") ? t("auth.errEmailInUse") : t("auth.errSignUp"));
      return;
    }
    // Confirmation d'email activée côté Supabase → pas de session immédiate.
    if (!data.session) {
      setLoading(false);
      toast(t("auth.checkEmail"), "success");
      return;
    }
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ prenom: prenom.trim(), nom: nom.trim(), role, phone: e164.replace(/^\+/, "") })
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
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-4">
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

        <div className="space-y-2">
          <Label htmlFor="password" className="text-base">{t("auth.password")}</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder="••••••••" className="h-12 pl-11 text-base" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {mode === "register" && <p className="text-xs text-muted-foreground">{t("auth.passwordMin")}</p>}
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

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" size="lg" className="w-full text-base" disabled={loading}>
          {loading ? <Spinner className="text-primary-foreground" /> : mode === "register" ? t("auth.signUp") : t("auth.signIn")}
        </Button>
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
