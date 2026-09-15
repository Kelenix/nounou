"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Clock, Copy, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatFcfa } from "@/lib/utils";
import type { ManualChannel } from "@/features/payments/manual";
import type { PaymentType } from "@/lib/supabase/database.types";

/**
 * Paiement mobile money « relais local » : le client paie sur le numéro affiché,
 * puis déclare l'identifiant de la transaction. Le paiement passe « en attente »
 * jusqu'à validation par un admin.
 */
export function ManualPay({
  type,
  montant,
  channels,
  payeeName,
}: {
  type: PaymentType;
  montant: number;
  channels: ManualChannel[];
  payeeName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const [moyen, setMoyen] = useState<ManualChannel["moyen"]>(channels[0]?.moyen ?? "orange_money");
  const [txId, setTxId] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = channels.find((c) => c.moyen === moyen) ?? channels[0];

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* presse-papiers indisponible : ignorer */
    }
  }

  async function submit() {
    setError(null);
    if (txId.trim().length < 4) {
      setError(t("payment.manualTxRequired"));
      return;
    }
    setLoading(true);
    const res = await fetch("/api/paiement/manuel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        moyen,
        transactionId: txId.trim(),
        senderPhone: senderPhone.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? t("payment.failed"));
      return;
    }
    setSubmitted(true);
    toast(t("payment.manualSubmitted"), "success");
    router.refresh();
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center">
        <Clock className="size-12 text-amber-600" />
        <h2 className="text-lg font-bold">{t("payment.manualPendingTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("payment.manualPendingText")}</p>
        <Button variant="secondary" onClick={() => router.push("/app")} className="mt-1">
          {t("payment.backHome")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      {/* Étape 1 : payer */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">
          {t("payment.manualStep1", { amount: formatFcfa(montant) })}
        </p>

        {channels.length > 1 && (
          <div className="grid grid-cols-2 gap-2">
            {channels.map((c) => (
              <button
                key={c.moyen}
                type="button"
                onClick={() => setMoyen(c.moyen)}
                className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  moyen === c.moyen
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {PAYMENT_METHOD_LABELS[c.moyen]}
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="space-y-1 rounded-2xl bg-secondary/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">{PAYMENT_METHOD_LABELS[selected.moyen]}</p>
                <p className="text-lg font-bold tracking-wide">{selected.number}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copy(selected.number)}>
                {copied === selected.number ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
              </Button>
            </div>
            {payeeName && (
              <p className="text-xs text-muted-foreground">{t("payment.manualPayee", { name: payeeName })}</p>
            )}
          </div>
        )}
      </div>

      {/* Étape 2 : déclarer */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">{t("payment.manualStep2")}</p>
        <div className="space-y-1.5">
          <Label htmlFor="tx-id">{t("payment.manualTxLabel")}</Label>
          <Input
            id="tx-id"
            value={txId}
            onChange={(e) => setTxId(e.target.value)}
            placeholder={t("payment.manualTxPlaceholder")}
          />
          <p className="text-xs text-muted-foreground">{t("payment.manualTxHint")}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sender">{t("payment.manualSenderLabel")}</Label>
          <Input
            id="sender"
            inputMode="numeric"
            value={senderPhone}
            onChange={(e) => setSenderPhone(e.target.value)}
            placeholder="07 00 00 00 00"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button className="w-full" onClick={submit} disabled={loading}>
        {loading ? <Spinner className="text-primary-foreground" /> : t("payment.manualSubmit")}
      </Button>

      <p className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" /> {t("payment.manualVerifyNote")}
      </p>
    </div>
  );
}
