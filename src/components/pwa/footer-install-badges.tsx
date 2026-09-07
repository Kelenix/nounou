"use client";

import { Smartphone, Apple } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";
import { usePwaInstall } from "@/components/pwa/install-context";

/** Badges « Android / iOS » cliquables : lancent l'installation ou affichent la marche à suivre. */
export function FooterInstallBadges() {
  const t = useTranslations();
  const { toast } = useToast();
  const { isStandalone, canInstall, promptInstall } = usePwaInstall();

  async function onAndroid() {
    if (isStandalone) return toast(t("pwa.already"), "info");
    if (canInstall) {
      const r = await promptInstall();
      if (r === "unavailable") toast(t("pwa.androidHint"), "info");
      return;
    }
    toast(t("pwa.androidHint"), "info");
  }

  function onIos() {
    toast(isStandalone ? t("pwa.already") : t("pwa.iosHint"), "info");
  }

  const cls =
    "inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary";

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onAndroid} className={cls}>
        <Smartphone className="size-4 text-primary" /> Android
      </button>
      <button type="button" onClick={onIos} className={cls}>
        <Apple className="size-4 text-primary" /> iOS
      </button>
    </div>
  );
}
