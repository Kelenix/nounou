"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "android" | "ios" | "other";
type PromptResult = "accepted" | "dismissed" | "unavailable";

type InstallContextValue = {
  platform: Platform;
  isStandalone: boolean;
  /** Un prompt d'installation natif (Android/Chrome) est disponible. */
  canInstall: boolean;
  /** Déclenche l'installation native ; renvoie l'issue. */
  promptInstall: () => Promise<PromptResult>;
};

const InstallContext = createContext<InstallContextValue | null>(null);

/** Accès à l'état d'installation PWA partagé (bandeau + badges du footer). */
export function usePwaInstall(): InstallContextValue {
  return (
    useContext(InstallContext) ?? {
      platform: "other",
      isStandalone: false,
      canInstall: false,
      promptInstall: async () => "unavailable",
    }
  );
}

/**
 * Capture l'événement `beforeinstallprompt` UNE seule fois et le partage.
 * Évite que plusieurs composants (bandeau, footer) se disputent l'événement,
 * consommable une seule fois.
 */
export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("other");
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true,
    );

    const ua = window.navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua)) {
      setPlatform("ios");
    } else if (/android/i.test(ua)) {
      setPlatform("android");
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function promptInstall(): Promise<PromptResult> {
    if (!deferred) return "unavailable";
    await deferred.prompt();
    const choice = await deferred.userChoice.catch(() => null);
    setDeferred(null);
    return choice?.outcome ?? "dismissed";
  }

  return (
    <InstallContext.Provider value={{ platform, isStandalone, canInstall: !!deferred, promptInstall }}>
      {children}
    </InstallContext.Provider>
  );
}
