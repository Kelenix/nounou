"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useTranslations } from "next-intl";
import { BadgeCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VerificationLevel } from "@/lib/supabase/database.types";

const DISMISS_KEY = "identity-prompt-dismissed";

/**
 * Popup invitant un utilisateur non vérifié (candidate OU employeur) à vérifier
 * son identité, avec un accès direct à la page de vérification. S'affiche une
 * fois par session (mémorisé en sessionStorage) tant que l'identité n'est pas
 * validée. Ne s'affiche jamais pour un compte déjà vérifié.
 */
export function IdentityVerificationPrompt({ level }: { level: VerificationLevel }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const alreadyVerified = level === "identity" || level === "verified";

  useEffect(() => {
    if (alreadyVerified) return;
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* sessionStorage indisponible : on affiche quand même */
    }
    if (!dismissed) setOpen(true);
  }, [alreadyVerified]);

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (alreadyVerified) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => (o ? setOpen(true) : dismiss())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-card p-6 shadow-2xl data-[state=open]:animate-scale-in">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <BadgeCheck className="size-5" />
            </span>
            <div className="flex-1">
              <Dialog.Title className="text-lg font-bold">{t("identity.promptTitle")}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {t("identity.promptBody")}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-full p-1 text-muted-foreground hover:bg-accent" aria-label={t("identity.promptLater")}>
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={dismiss}>
              {t("identity.promptLater")}
            </Button>
            <Button asChild onClick={dismiss}>
              <Link href="/app/profil/modifier#identite">{t("identity.promptCta")}</Link>
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
