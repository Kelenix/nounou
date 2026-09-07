"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Counts = {
  confirmed: number;
  failed: number;
  consistent: number;
  mismatch: number;
  unverifiable: number;
};

/**
 * Déclenche la réconciliation des paiements auprès du fournisseur (CinetPay…).
 * Sans `reference` : réconcilie toutes les transactions bloquées « en attente ».
 * Avec `reference` : ne vérifie que cette transaction.
 */
export function ReconcileButton({
  reference,
  label,
  variant = "default",
  size = "default",
}: {
  reference?: string;
  label?: string;
  variant?: "default" | "secondary" | "ghost";
  size?: "default" | "sm";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/paiements/reconcilier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reference ? { reference } : {}),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; checked: number; counts: Counts }
        | { error: string }
        | null;

      if (!res.ok || !data || "error" in data) {
        toast(data && "error" in data ? data.error : t("revenus.reconcileError"), "error");
        return;
      }

      const { checked, counts } = data;
      if (checked === 0) {
        toast(t("revenus.reconcileNothing"), "success");
      } else if (counts.mismatch > 0) {
        toast(t("revenus.reconcileMismatch", { count: counts.mismatch }), "error");
      } else {
        toast(
          t("revenus.reconcileDone", {
            confirmed: counts.confirmed,
            failed: counts.failed,
            checked,
          }),
          "success",
        );
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={run} disabled={loading} variant={variant} size={size}>
      <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
      {label ?? t("revenus.reconcileAll")}
    </Button>
  );
}
