"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { emailSchema } from "@/features/auth/schemas";

/** Demande de réinitialisation : envoie un e-mail de récupération (Supabase Auth). */
export function ForgotPasswordForm() {
  const t = useTranslations();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized = email.trim().toLowerCase();
    if (!emailSchema.safeParse({ email: normalized }).success) {
      setError(t("auth.errInvalidEmail"));
      return;
    }
    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback?redirect=/reinitialiser-mot-de-passe`;
    // On ignore volontairement l'erreur éventuelle : ne jamais révéler si un
    // compte existe pour cette adresse (évite l'énumération des e-mails).
    await supabase.auth.resetPasswordForEmail(normalized, { redirectTo });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <CheckCircle2 className="size-7" />
        </span>
        <h1 className="text-2xl font-extrabold">{t("auth.resetSentTitle")}</h1>
        <p className="text-base text-muted-foreground">{t("auth.resetSentDesc")}</p>
        <Link href="/connexion" className="inline-block font-semibold text-primary hover:underline">
          {t("auth.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{t("auth.forgotTitle")}</h1>
        <p className="text-base text-muted-foreground">{t("auth.forgotSubtitle")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-base">{t("auth.email")}</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t("auth.emailPlaceholder")}
            className="h-12 pl-11 text-base"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="w-full text-base" disabled={loading}>
        {loading ? <Spinner className="text-primary-foreground" /> : t("auth.sendResetLink")}
      </Button>

      <p className="text-center text-sm">
        <Link href="/connexion" className="font-medium text-primary hover:underline">
          {t("auth.backToLogin")}
        </Link>
      </p>
    </form>
  );
}
