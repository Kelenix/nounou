"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, ShieldCheck, Clock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatFcfa, toE164Ci } from "@/lib/utils";
import type { PaymentMethod, PaymentType } from "@/lib/supabase/database.types";

const POLL_INTERVAL_MS = 4000;
const POLL_MAX_ATTEMPTS = 30; // ~2 min

export function PayForm({
  type,
  montant,
  defaultPhone,
  methods,
  softpay = false,
}: {
  type: PaymentType;
  montant: number;
  defaultPhone: string;
  /** Moyens réellement configurés (clés présentes) à proposer. */
  methods: PaymentMethod[];
  /** SOFTPAY actif (PayDunya live) : le paiement se fait in-app avec OTP pour Orange Money. */
  softpay?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const [moyen, setMoyen] = useState<PaymentMethod>(methods[0] ?? "orange_money");
  const [phone, setPhone] = useState(defaultPhone.replace(/^\+225/, ""));
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Suivi SOFTPAY (validation sur le téléphone).
  const [pending, setPending] = useState<{ reference: string; message: string } | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  function succeed() {
    if (!mounted.current) return;
    setPending(null);
    setLoading(false);
    setDone(true);
    toast(t("payment.confirmed"), "success");
    router.refresh();
  }

  // Interroge le statut jusqu'à confirmation par l'IPN (ou expiration).
  async function poll(reference: string, attempt: number) {
    if (!mounted.current) return;
    if (attempt >= POLL_MAX_ATTEMPTS) {
      setTimedOut(true);
      return;
    }
    try {
      const res = await fetch(`/api/paiement/statut?reference=${encodeURIComponent(reference)}`);
      const data = await res.json().catch(() => null);
      if (data?.statut === "reussi") return succeed();
      if (data?.statut === "echoue" || data?.statut === "annule") {
        if (!mounted.current) return;
        setPending(null);
        setError(t("payment.failed"));
        return;
      }
    } catch {
      /* réseau : on retentera au prochain tour */
    }
    setTimeout(() => poll(reference, attempt + 1), POLL_INTERVAL_MS);
  }

  async function pay() {
    setError(null);
    setTimedOut(false);
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
    if (softpay && moyen === "orange_money" && otp.trim().length < 4) {
      setError(t("payment.otpRequired"));
      return;
    }
    setLoading(true);
    const res = await fetch("/api/paiement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, moyen, phone: e164, otp: otp.trim() || undefined }),
    });
    const data = await res.json().catch(() => null);

    // Wave / page hébergée : redirection.
    if (res.ok && data?.redirectUrl) {
      window.location.href = data.redirectUrl;
      return;
    }

    if (!res.ok) {
      setLoading(false);
      setError(data?.error ?? t("payment.failed"));
      return;
    }

    // Mock : réussi immédiatement.
    if (data?.status === "reussi") return succeed();

    // SOFTPAY (Orange/MTN/Moov) : validation sur le téléphone → suivi du statut.
    if (data?.status === "en_attente" && data?.reference) {
      setPending({ reference: data.reference, message: data.message || t("payment.pendingDefault") });
      poll(data.reference, 0);
      return;
    }

    setLoading(false);
    setError(t("payment.failed"));
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

  // Paiement SOFTPAY en attente de validation sur le téléphone.
  if (pending) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary-soft/40 p-6 text-center">
        <Smartphone className="size-12 text-primary" />
        <h2 className="text-lg font-bold">{t("payment.pendingTitle")}</h2>
        <p className="text-sm text-muted-foreground">{pending.message}</p>
        {timedOut ? (
          <>
            <p className="text-sm text-muted-foreground">{t("payment.pendingTimeout")}</p>
            <Button
              onClick={() => {
                setTimedOut(false);
                poll(pending.reference, 0);
              }}
              className="mt-1"
            >
              {t("payment.recheck")}
            </Button>
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm text-primary">
            <Spinner /> {t("payment.pendingWait")}
          </p>
        )}
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

      {softpay && moyen === "orange_money" && (
        <div className="space-y-2">
          <Label htmlFor="om-otp">{t("payment.otpLabel")}</Label>
          <Input
            id="om-otp"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder={t("payment.otpPlaceholder")}
          />
          <p className="text-xs text-muted-foreground">{t("payment.otpHint")}</p>
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
