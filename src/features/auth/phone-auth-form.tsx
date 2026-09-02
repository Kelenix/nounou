"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
      setError("Renseignez votre prénom et votre nom.");
      return;
    }
    const parsed = phoneSchema.safeParse({ phone: phoneInput });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Numéro invalide");
      return;
    }
    const e164 = toE164Ci(parsed.data.phone);
    if (!e164) {
      setError("Numéro invalide");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
    setLoading(false);
    if (error) {
      setError("Impossible d'envoyer le code. Vérifiez le numéro.");
      return;
    }
    setPhoneE164(e164);
    setStep("otp");
    toast("Code envoyé par SMS", "success");
  }

  async function resend() {
    setLoading(true);
    await supabase.auth.signInWithOtp({ phone: phoneE164 });
    setLoading(false);
    toast("Nouveau code envoyé", "success");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = otpSchema.safeParse({ code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Code invalide");
      return;
    }
    setLoading(true);
    const { error: vErr } = await supabase.auth.verifyOtp({ phone: phoneE164, token: parsed.data.code, type: "sms" });
    if (vErr) {
      setLoading(false);
      setError("Code incorrect ou expiré. Réessayez.");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();

    if (mode === "register") {
      await supabase.from("profiles").update({ prenom: prenom.trim(), nom: nom.trim(), role }).eq("id", user!.id);
      if (role === "candidate") await supabase.from("candidate_profiles").upsert({ user_id: user!.id });
      else await supabase.from("employer_profiles").upsert({ user_id: user!.id });
      setLoading(false);
      toast("Compte créé, bienvenue !", "success");
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
          <ArrowLeft className="size-4" /> Modifier le numéro
        </button>
        <div className="space-y-1.5 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <ShieldCheck className="size-7" />
          </span>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Entrez le code</h1>
          <p className="text-base text-muted-foreground">Un code a été envoyé au {formatPhoneCi(phoneE164)}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="code" className="text-base">Code à 6 chiffres</Label>
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
          {loading ? <Spinner className="text-primary-foreground" /> : "Vérifier le code"}
        </Button>
        <button type="button" onClick={resend} disabled={loading} className="flex w-full items-center justify-center gap-1 text-sm text-primary">
          <RotateCcw className="size-3.5" /> Renvoyer le code
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} className="space-y-4">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          {mode === "register" ? "Créer un compte" : "Bienvenue"}
        </h1>
        <p className="text-base text-muted-foreground">
          {mode === "register"
            ? "Quelques informations et c'est parti."
            : "Connectez-vous avec votre numéro de téléphone."}
        </p>
      </div>

      {mode === "register" && (
        <>
          <div className="space-y-2">
            <Label className="text-base">Je suis…</Label>
            <div className="grid grid-cols-2 gap-2">
              <RoleChip active={role === "employer"} onClick={() => setRole("employer")} icon={<Search className="size-5" />} label="Une famille" />
              <RoleChip active={role === "candidate"} onClick={() => setRole("candidate")} icon={<Briefcase className="size-5" />} label="Une nounou" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prenom" className="text-base">Prénom</Label>
              <Input id="prenom" className="h-12 text-base" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom" className="text-base">Nom</Label>
              <Input id="nom" className="h-12 text-base" value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-base">Numéro de téléphone</Label>
        <div className="flex items-center gap-2">
          <span className="flex h-12 items-center rounded-2xl border border-input bg-secondary px-3.5 text-base font-medium text-muted-foreground">+225</span>
          <div className="relative flex-1">
            <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input id="phone" inputMode="numeric" autoComplete="tel" placeholder="07 00 00 00 00" className="h-12 pl-11 text-base" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="w-full text-base" disabled={loading}>
        {loading ? <Spinner className="text-primary-foreground" /> : mode === "register" ? "Continuer" : "Recevoir le code"}
      </Button>

      {isDev && (
        <p className="rounded-xl bg-secondary p-2 text-center text-xs text-muted-foreground">
          Dev : numéros 07 00 00 00 01/02/03 · code <b>123456</b>
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
