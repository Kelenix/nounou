"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * Boutons de validation manuelle d'un paiement mobile money « relais local ».
 * Confirmer → active le profil ; Rejeter → marque la transaction échouée.
 */
export function ValidatePaymentButtons({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const [loading, setLoading] = useState<"confirm" | "reject" | null>(null);

  async function decide(decision: "confirm" | "reject") {
    setLoading(decision);
    try {
      const res = await fetch("/api/admin/paiements/valider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, decision }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: true; error?: string } | null;
      if (!res.ok || !data?.ok) {
        toast(data?.error ?? t("revenus.validateError"), "error");
        return;
      }
      toast(decision === "confirm" ? t("revenus.validateConfirmed") : t("revenus.validateRejected"), "success");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button size="sm" variant="ghost" disabled={loading !== null} onClick={() => decide("reject")}>
        <X className="size-4" /> {t("revenus.validateReject")}
      </Button>
      <Button size="sm" disabled={loading !== null} onClick={() => decide("confirm")}>
        <Check className="size-4" /> {t("revenus.validateConfirm")}
      </Button>
    </div>
  );
}
