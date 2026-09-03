"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";

/** Bouton « Continuer avec Google » (OAuth via Supabase, flux PKCE + /auth/callback). */
export function GoogleButton() {
  const params = useSearchParams();
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirect = params.get("redirect") ?? "/app";

  async function signIn() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error: oErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(redirect)}` },
    });
    // En cas de succès, le navigateur part vers Google ; sinon on réactive le bouton.
    if (oErr) {
      setLoading(false);
      setError(t("auth.googleError"));
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={signIn}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-input bg-background text-base font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
      >
        {loading ? <Spinner /> : <GoogleIcon />}
        {t("auth.continueWithGoogle")}
      </button>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 43.5c5.4 0 10.3-2.1 14-5.4l-6.5-5.5C29.6 34.1 26.9 35 24 35c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39 16.2 43.5 24 43.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.5 5.5c-.5.4 7-5.1 7-15.1 0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
