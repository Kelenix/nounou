"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { passwordSchema } from "@/features/auth/schemas";

/** Définition d'un nouveau mot de passe après clic sur le lien de récupération. */
export function ResetPasswordForm() {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // null = en cours de vérification ; true/false = session de récupération présente.
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordSchema.safeParse({ password }).success) {
      setError(t("auth.errPassword"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.errPasswordMismatch"));
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(t("auth.resetError"));
      return;
    }
    toast(t("auth.resetSuccess"), "success");
    router.replace("/app");
    router.refresh();
  }

  if (hasSession === null) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  // Lien invalide ou expiré : aucune session de récupération.
  if (!hasSession) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-extrabold">{t("auth.resetInvalidTitle")}</h1>
        <p className="text-base text-muted-foreground">{t("auth.resetInvalidDesc")}</p>
        <Link href="/mot-de-passe-oublie" className="inline-block font-semibold text-primary hover:underline">
          {t("auth.resetRetry")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{t("auth.resetTitle")}</h1>
        <p className="text-base text-muted-foreground">{t("auth.resetSubtitle")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-base">{t("auth.newPassword")}</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="h-12 pl-11 text-base"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("auth.passwordMin")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm" className="text-base">{t("auth.confirmPassword")}</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="h-12 pl-11 text-base"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="w-full text-base" disabled={loading}>
        {loading ? <Spinner className="text-primary-foreground" /> : t("auth.resetSubmit")}
      </Button>
    </form>
  );
}
