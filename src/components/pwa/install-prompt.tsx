"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Download, Share, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/components/pwa/install-context";

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 30;

function recentlyDismissed(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY) ?? "0");
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Bandeau d'installation PWA (mobile).
 * - Android/Chrome : bouton « Installer » natif (via le prompt partagé).
 * - iOS/Safari : marche à suivre (pas d'API d'installation sur iOS).
 * Masqué dans l'app connectée (/app, /admin) pour ne pas gêner la navigation.
 */
export function PwaInstallPrompt() {
  const t = useTranslations();
  const pathname = usePathname();
  const { platform, isStandalone, canInstall, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(true); // fermé tant que le montage n'a pas vérifié
  const [iosReady, setIosReady] = useState(false);

  useEffect(() => {
    setDismissed(recentlyDismissed());
    // iOS : laisser respirer avant d'afficher l'aide.
    const timer = setTimeout(() => setIosReady(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const hiddenRoute = pathname.startsWith("/app") || pathname.startsWith("/admin");

  const mode: "android" | "ios" | null =
    isStandalone || dismissed || hiddenRoute
      ? null
      : canInstall
        ? "android"
        : platform === "ios" && iosReady
          ? "ios"
          : null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* stockage indisponible : sans effet */
    }
  }

  async function install() {
    await promptInstall();
    setDismissed(true);
  }

  if (!mode) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Download className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight">{t("pwa.title")}</p>
            {mode === "android" ? (
              <p className="mt-1 text-sm text-muted-foreground">{t("pwa.body")}</p>
            ) : (
              <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                {t("pwa.iosStep1")}
                <Share className="inline size-4 text-primary" />
                {t("pwa.iosStep2")}
                <Plus className="inline size-4 text-primary" />
                {t("pwa.iosStep3")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("pwa.later")}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {mode === "android" && (
          <div className="mt-3 flex gap-2">
            <Button onClick={install} size="sm" className="flex-1">
              <Download className="size-4" /> {t("pwa.install")}
            </Button>
            <Button onClick={dismiss} size="sm" variant="ghost">
              {t("pwa.later")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
