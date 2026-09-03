"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatFcfa, toE164Ci } from "@/lib/utils";
import type { PaymentMethod, PaymentType } from "@/lib/supabase/database.types";

export function PayForm({
  type,
  montant,
  defaultPhone,
  methods,
}: {
  type: PaymentType;
  montant: number;
  defaultPhone: string;
  /** Moyens réellement configurés (clés présentes) à proposer. */
  methods: PaymentMethod[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const [moyen, setMoyen] = useState<PaymentMethod>(methods[0] ?? "orange_money");
  const [phone, setPhone] = useState(defaultPhone.replace(/^\+225/, ""));
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setError(null);
    // Le Mobile Money exige un numéro ; la carte (Stripe) non.
    let e164: string | undefined;
    if (moyen !== "carte") {
      const parsed = toE164Ci(phone);
      if (!parsed) {
        setError(t("payment.invalidNumber"));
        return;
      }
      e164 = parsed;
    }
    setLoading(true);
    const res = await fetch("/api/paiement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, moyen, phone: e164 }),
    });
    const data = await res.json().catch(() => null);

    // Vrai fournisseur : redirection vers la page de paiement hébergée.
    if (res.ok && data?.redirectUrl) {
      window.location.href = data.redirectUrl;
      return;
    }

    setLoading(false);
    if (!res.ok || data?.status !== "reussi") {
      setError(data?.error ?? t("payment.failed"));
      return;
    }
    setDone(true);
    toast(t("payment.confirmed"), "success");
    router.refresh();
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary-soft/40 p-6 text-center">
        <CheckCircle2 className="size-12 text-primary" />
        <h2 className="text-lg font-bold">{t("payment.confirmed")}</h2>
        <p className="text-sm text-muted-foreground">
          {type === "activation_candidate" ? t("payment.candidateDone") : t("payment.employerDone")}
        </p>
        <Button onClick={() => router.push("/app")} className="mt-2">{t("payment.backHome")}</Button>
      </div>
    );
  }

  // Aucun moyen configuré (clés absentes) : ne rien afficher de non fonctionnel.
  if (methods.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
        <Clock className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("payment.unavailable")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="space-y-2">
        <Label>{t("payment.method")}</Label>
        <div className="grid grid-cols-2 gap-2">
          {methods.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMoyen(value)}
              className={`rounded-2xl border px-3 py-3 text-sm font-medium transition-colors ${
                moyen === value
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-background text-muted-foreground"
              }`}
            >
              {PAYMENT_METHOD_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      {moyen !== "carte" && (
        <div className="space-y-2">
          <Label htmlFor="momo-phone">{t("payment.momoNumber")}</Label>
          <div className="flex items-center gap-2">
            <span className="flex h-11 items-center rounded-2xl border border-input bg-secondary px-3 text-sm font-medium text-muted-foreground">
              +225
            </span>
            <Input
              id="momo-phone"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07 00 00 00 00"
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button className="w-full" onClick={pay} disabled={loading}>
        {loading ? <Spinner className="text-primary-foreground" /> : t("payment.pay", { amount: formatFcfa(montant) })}
      </Button>

      <p className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" /> {t("payment.secure")}
      </p>
    </div>
  );
}
