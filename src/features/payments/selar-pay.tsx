"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * Paiement via Selar (particulier, sans entreprise). Le client paie sur la page
 * Selar avec l'e-mail de son compte ; l'activation est appliquée côté serveur
 * par le webhook `/api/paiement/selar`. Ici on ouvre le lien Selar puis on
 * rafraîchit la page (la vue serveur bascule sur « déjà activé » une fois le
 * webhook passé).
 */
export function SelarPay({ selarUrl, email }: { selarUrl: string; email: string }) {
  const router = useRouter();
  const t = useTranslations();
  const [checking, setChecking] = useState(false);

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-base font-bold">{t("payment.selarTitle")}</h2>

      <p className="flex items-start gap-2 rounded-2xl bg-primary-soft/60 p-3 text-sm text-primary">
        <Info className="mt-0.5 size-4 shrink-0" />
        {t("payment.selarInstruction", { email })}
      </p>

      <Button asChild className="w-full">
        <a href={selarUrl} target="_blank" rel="noopener noreferrer">
          {t("payment.selarOpen")} <ExternalLink className="ml-1 size-4" />
        </a>
      </Button>

      <p className="text-xs text-muted-foreground">{t("payment.selarNote")}</p>

      <Button
        variant="secondary"
        className="w-full"
        disabled={checking}
        onClick={() => {
          setChecking(true);
          router.refresh();
          // Laisse le refresh se faire ; réactive le bouton si l'utilisateur reste.
          setTimeout(() => setChecking(false), 2500);
        }}
      >
        {checking ? <Spinner /> : t("payment.selarCheck")}
      </Button>
    </div>
  );
}
