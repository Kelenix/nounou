"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatFcfa, toE164Ci } from "@/lib/utils";
import type { PaymentMethod, PaymentType } from "@/lib/supabase/database.types";

const METHODS = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][];

export function PayForm({
  type,
  montant,
  defaultPhone,
}: {
  type: PaymentType;
  montant: number;
  defaultPhone: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [moyen, setMoyen] = useState<PaymentMethod>("orange_money");
  const [phone, setPhone] = useState(defaultPhone.replace(/^\+225/, ""));
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setError(null);
    const e164 = toE164Ci(phone);
    if (!e164) {
      setError("Numéro Mobile Money invalide (10 chiffres).");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/paiement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, moyen, phone: e164 }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok || data?.status !== "reussi") {
      setError(data?.error ?? "Le paiement a échoué. Réessayez.");
      return;
    }
    setDone(true);
    toast("Paiement confirmé", "success");
    router.refresh();
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary-soft/40 p-6 text-center">
        <CheckCircle2 className="size-12 text-primary" />
        <h2 className="text-lg font-bold">Paiement confirmé</h2>
        <p className="text-sm text-muted-foreground">
          {type === "activation_candidate"
            ? "Votre profil est désormais actif et visible des employeurs."
            : "Votre accès premium est activé."}
        </p>
        <Button onClick={() => router.push("/app")} className="mt-2">Retour à l&apos;accueil</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="space-y-2">
        <Label>Moyen de paiement</Label>
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map(([value, label]) => (
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
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="momo-phone">Numéro Mobile Money</Label>
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button className="w-full" onClick={pay} disabled={loading}>
        {loading ? <Spinner className="text-primary-foreground" /> : `Payer ${formatFcfa(montant)}`}
      </Button>

      <p className="flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" /> Paiement sécurisé
      </p>
    </div>
  );
}
