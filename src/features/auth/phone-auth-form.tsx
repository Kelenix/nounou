"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, Phone, ShieldCheck, Search, Briefcase, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { phoneSchema, otpSchema } from "@/features/auth/schemas";
import { toE164Ci, formatPhoneCi, cn } from "@/lib/utils";
import type { UserRole } from "@/lib/supabase/database.types";

export function PhoneAuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations();
  const redirect = params.get("redirect") ?? "/app";
  const roleParam = params.get("role");
  const { toast } = useToast();
  const supabase = createClient();

  const [step, setStep] = useState<"infos" | "otp">("infos");
  const [role, setRole] = useState<UserRole>(roleParam === "candidate" ? "candidate" : "employer");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDev = process.env.NODE_ENV !== "production";

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "register" && (prenom.trim().length < 2 || nom.trim().length < 2)) {
      setError(t("auth.errNameRequired"));
      return;
    }
    const parsed = phoneSchema.safeParse({ phone: phoneInput });
    if (!parsed.success) {
      setError(t("auth.errInvalidNumber"));
      return;
    }
    const e164 = toE164Ci(parsed.data.phone);
    if (!e164) {
      setError(t("auth.errInvalidNumber"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
    setLoading(false);
    if (error) {
      setError(t("auth.errSendFailed"));
      return;
    }
    setPhoneE164(e164);
    setStep("otp");
    toast(t("auth.toastCodeSent"), "success");
  }

  async function resend() {
    setLoading(true);
    await supabase.auth.signInWithOtp({ phone: phoneE164 });
    setLoading(false);
    toast(t("auth.toastNewCode"), "success");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = otpSchema.safeParse({ code });
    if (!parsed.success) {
      setError(t("auth.errWrongCode"));
      return;
    }
    setLoading(true);
    const { error: vErr } = await supabase.auth.verifyOtp({ phone: phoneE164, token: parsed.data.code, type: "sms" });
    if (vErr) {
      setLoading(false);
      setError(t("auth.errWrongCode"));
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();

    if (mode === "register") {
      await supabase.from("profiles").update({ prenom: prenom.trim(), nom: nom.trim(), role }).eq("id", user!.id);
      if (role === "candidate") await supabase.from("candidate_profiles").upsert({ user_id: user!.id });
      else await supabase.from("employer_profiles").upsert({ user_id: user!.id });
      setLoading(false);
      toast(t("auth.toastAccountCreated"), "success");
      router.replace(redirect.startsWith("/") ? redirect : "/app");
      router.refresh();
      return;
    }

    // login
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).maybeSingle();
    setLoading(false);
    if (!profile?.role) router.replace("/onboarding");
    else if (profile.role === "admin") router.replace("/admin");
    else router.replace(redirect.startsWith("/") ? redirect : "/app");
    router.refresh();
  }

  if (step === "otp") {
    return (
      <form onSubmit={verify} className="space-y-4">
        <button
          type="button"
          onClick={() => { setStep("infos"); setCode(""); setError(null); }}
          className="flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" /> {t("auth.editNumber")}
        </button>
        <div className="space-y-1.5 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <ShieldCheck className="size-7" />
          </span>
          <h1 className="text-2xl font-extrabold sm:text-3xl">{t("auth.enterCode")}</h1>
          <p className="text-base text-muted-foreground">{t("auth.codeSentTo", { phone: formatPhoneCi(phoneE164) })}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="code" className="text-base">{t("auth.sixDigitCode")}</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="______"
            className="h-14 text-center text-3xl tracking-[0.5em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full text-base" disabled={loading}>
          {loading ? <Spinner className="text-primary-foreground" /> : t("auth.verifyCode")}
        </Button>
        <button type="button" onClick={resend} disabled={loading} className="flex w-full items-center justify-center gap-1 text-sm text-primary">
          <RotateCcw className="size-3.5" /> {t("auth.resendCode")}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} className="space-y-4">
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
        <Label htmlFor="phone" className="text-base">{t("auth.phone")}</Label>
        <div className="flex items-center gap-2">
          <span className="flex h-12 items-center rounded-2xl border border-input bg-secondary px-3.5 text-base font-medium text-muted-foreground">+225</span>
          <div className="relative flex-1">
            <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input id="phone" inputMode="numeric" autoComplete="tel" placeholder={t("auth.phonePlaceholder")} className="h-12 pl-11 text-base" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="w-full text-base" disabled={loading}>
        {loading ? <Spinner className="text-primary-foreground" /> : mode === "register" ? t("auth.continue") : t("auth.receiveCode")}
      </Button>

      {isDev && (
        <p className="rounded-xl bg-secondary p-2 text-center text-xs text-muted-foreground">
          {t("auth.devHint")}
        </p>
      )}
    </form>
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
