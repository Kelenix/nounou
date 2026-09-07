"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Download, Share, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 30;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function recentlyDismissed(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY) ?? "0");
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Bandeau d'installation PWA (mobile).
 * - Android/Chrome : capture `beforeinstallprompt` → bouton « Installer » natif.
 * - iOS/Safari : affiche la marche à suivre (pas d'API d'installation sur iOS).
 * Masqué dans l'app connectée (/app, /admin) pour ne pas gêner la navigation.
 */
export function PwaInstallPrompt() {
  const t = useTranslations();
  const pathname = usePathname();
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  const hiddenRoute = pathname.startsWith("/app") || pathname.startsWith("/admin");

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("android");
    };
    const onInstalled = () => {
      setMode(null);
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        /* stockage indisponible : sans effet */
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS : pas de `beforeinstallprompt` → détection Safari iOS.
    const ua = window.navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIOS && isSafari) {
      iosTimer = setTimeout(() => setMode((m) => m ?? "ios"), 2500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  function dismiss() {
    setMode(null);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* sans effet */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => null);
    setDeferred(null);
    setMode(null);
  }

  if (!mode || hiddenRoute) return null;

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
