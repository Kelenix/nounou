import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentMethod, PaymentStatus, PaymentType } from "@/lib/supabase/database.types";

export type InitiatePaymentInput = {
  userId: string;
  montant: number;
  moyen: PaymentMethod;
  type: PaymentType;
  phone: string;
};

export type InitiatePaymentResult = {
  reference: string;
  status: PaymentStatus;
  /** URL de paiement hébergée (agrégateur/Stripe) vers laquelle rediriger l'utilisateur. */
  redirectUrl?: string;
};

/** Événement de confirmation reçu et vérifié depuis un webhook fournisseur. */
export type PaymentWebhookEvent = {
  reference: string;
  success: boolean;
};

/**
 * Interface d'un fournisseur de paiement.
 * Isole la logique pour brancher CinetPay / PayDunya / Stripe (cf. ADR-002)
 * sans toucher au reste du code.
 */
export interface PaymentProvider {
  readonly name: string;
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  /** Vérifie la signature d'un webhook entrant et en extrait le statut. `null` = à ignorer. */
  parseWebhook(request: Request): Promise<PaymentWebhookEvent | null>;
}

// ---------------------------------------------------------------------------
// Helpers communs
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variable d'environnement manquante : ${name}`);
  return v;
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function webhookUrl(name: string): string {
  return `${appUrl()}/api/paiement/webhook/${name}`;
}

function returnUrl(): string {
  return `${appUrl()}/app/paiement`;
}

function makeReference(input: InitiatePaymentInput): string {
  return `JMN-${input.type}-${input.userId.slice(0, 8)}-${Date.now()}`;
}

function labelForType(type: PaymentType): string {
  return type === "activation_candidate" ? "Activation du profil candidate" : "Accès premium employeur";
}

// ---------------------------------------------------------------------------
// Mock (développement) — paiement immédiatement réussi, aucun webhook
// ---------------------------------------------------------------------------

class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const reference = `MOCK-${input.type}-${input.userId.slice(0, 8)}-${input.montant}`;
    console.info(`[paiement mock] ${input.moyen} — ${input.montant} FCFA — ${input.phone} → réussi`);
    return { reference, status: "reussi" };
  }

  async parseWebhook(): Promise<PaymentWebhookEvent | null> {
    return null;
  }
}

// ---------------------------------------------------------------------------
// CinetPay (Mobile Money : Orange, MTN, Moov, Wave)
// Doc : https://docs.cinetpay.com — finaliser le mapping exact avec vos clés.
// ---------------------------------------------------------------------------

class CinetPayProvider implements PaymentProvider {
  readonly name = "cinetpay";
  private static readonly BASE = "https://api-checkout.cinetpay.com/v2";

  private creds() {
    return { apikey: requireEnv("CINETPAY_API_KEY"), site_id: requireEnv("CINETPAY_SITE_ID") };
  }

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const { apikey, site_id } = this.creds();
    const reference = makeReference(input);
    const res = await fetch(`${CinetPayProvider.BASE}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apikey,
        site_id,
        transaction_id: reference,
        amount: input.montant,
        currency: "XOF",
        description: labelForType(input.type),
        customer_phone_number: input.phone,
        channels: "MOBILE_MONEY",
        notify_url: webhookUrl("cinetpay"),
        return_url: returnUrl(),
      }),
    });
    const data = await res.json().catch(() => null);
    const url = data?.data?.payment_url as string | undefined;
    if (!url) throw new Error(`CinetPay : initiation échouée (${data?.message ?? res.status})`);
    return { reference, status: "en_attente", redirectUrl: url };
  }

  async parseWebhook(request: Request): Promise<PaymentWebhookEvent | null> {
    // CinetPay poste en form-urlencoded (cpm_trans_id = notre transaction_id).
    const params = new URLSearchParams(await request.text());
    const reference = params.get("cpm_trans_id");
    if (!reference) return null;
    // Source de vérité : on re-vérifie le statut réel via l'API /payment/check
    // (recommandé par CinetPay plutôt que de se fier au seul webhook).
    const { apikey, site_id } = this.creds();
    const res = await fetch(`${CinetPayProvider.BASE}/payment/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey, site_id, transaction_id: reference }),
    });
    const data = await res.json().catch(() => null);
    return { reference, success: data?.data?.status === "ACCEPTED" };
  }
}

// ---------------------------------------------------------------------------
// PayDunya (Mobile Money pan-africain)
// Doc : https://paydunya.com/developers — finaliser le mapping avec vos clés.
// ---------------------------------------------------------------------------

class PayDunyaProvider implements PaymentProvider {
  readonly name = "paydunya";

  private base() {
    return process.env.PAYDUNYA_MODE === "live"
      ? "https://app.paydunya.com/api/v1"
      : "https://app.paydunya.com/sandbox-api/v1";
  }

  private headers() {
    return {
      "Content-Type": "application/json",
      "PAYDUNYA-MASTER-KEY": requireEnv("PAYDUNYA_MASTER_KEY"),
      "PAYDUNYA-PRIVATE-KEY": requireEnv("PAYDUNYA_PRIVATE_KEY"),
      "PAYDUNYA-TOKEN": requireEnv("PAYDUNYA_TOKEN"),
    };
  }

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const reference = makeReference(input);
    const res = await fetch(`${this.base()}/checkout-invoice/create`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        invoice: { total_amount: input.montant, description: labelForType(input.type) },
        store: { name: "J'ai ma nounou" },
        custom_data: { reference },
        actions: { callback_url: webhookUrl("paydunya"), return_url: returnUrl() },
      }),
    });
    const data = await res.json().catch(() => null);
    const url = data?.response_text as string | undefined;
    if (data?.response_code !== "00" || !url) {
      throw new Error(`PayDunya : initiation échouée (${data?.response_text ?? res.status})`);
    }
    return { reference, status: "en_attente", redirectUrl: url };
  }

  async parseWebhook(request: Request): Promise<PaymentWebhookEvent | null> {
    // PayDunya poste en form-urlencoded (clés `data[...]`).
    const params = new URLSearchParams(await request.text());
    const reference = params.get("data[custom_data][reference]");
    if (!reference) return null;
    // TODO : vérifier `data[hash]` = SHA-512(master_key) selon la doc PayDunya avant de confirmer.
    return { reference, success: params.get("data[status]") === "completed" };
  }
}

// ---------------------------------------------------------------------------
// Stripe (carte bancaire) — Checkout hébergé + webhook signé
// ---------------------------------------------------------------------------

class StripeProvider implements PaymentProvider {
  readonly name = "stripe";

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const key = requireEnv("STRIPE_SECRET_KEY");
    const reference = makeReference(input);
    const body = new URLSearchParams();
    body.set("mode", "payment");
    body.set("success_url", `${returnUrl()}?status=success`);
    body.set("cancel_url", `${returnUrl()}?status=cancel`);
    body.set("client_reference_id", reference);
    body.set("metadata[reference]", reference);
    body.set("line_items[0][quantity]", "1");
    body.set("line_items[0][price_data][currency]", "xof"); // XOF : devise sans décimales
    body.set("line_items[0][price_data][unit_amount]", String(input.montant));
    body.set("line_items[0][price_data][product_data][name]", labelForType(input.type));
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await res.json().catch(() => null);
    const url = data?.url as string | undefined;
    if (!url) throw new Error(`Stripe : initiation échouée (${data?.error?.message ?? res.status})`);
    return { reference, status: "en_attente", redirectUrl: url };
  }

  async parseWebhook(request: Request): Promise<PaymentWebhookEvent | null> {
    const secret = requireEnv("STRIPE_WEBHOOK_SECRET");
    const sig = request.headers.get("stripe-signature");
    const raw = await request.text();
    if (!sig || !verifyStripeSignature(raw, sig, secret)) return null;
    const event = JSON.parse(raw);
    if (event?.type !== "checkout.session.completed") return null;
    const session = event.data?.object ?? {};
    const reference = session.client_reference_id ?? session.metadata?.reference;
    if (!reference) return null;
    return { reference, success: session.payment_status === "paid" };
  }
}

/** Vérifie l'en-tête `stripe-signature` (format `t=...,v1=...`, HMAC-SHA256 de `t.payload`). */
function verifyStripeSignature(payload: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")) as [string, string][]);
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Sélection du fournisseur
//   - Carte  → PAYMENT_CARD_PROVIDER   (mock | stripe)              défaut mock
//   - Mobile → PAYMENT_MOBILE_PROVIDER (mock | cinetpay | paydunya) défaut mock
// ---------------------------------------------------------------------------

const PROVIDERS: Record<string, () => PaymentProvider> = {
  mock: () => new MockPaymentProvider(),
  cinetpay: () => new CinetPayProvider(),
  paydunya: () => new PayDunyaProvider(),
  stripe: () => new StripeProvider(),
};

/** Fournisseur à utiliser pour une initiation, selon le moyen choisi. */
export function getPaymentProvider(moyen: PaymentMethod): PaymentProvider {
  const key =
    moyen === "carte"
      ? (process.env.PAYMENT_CARD_PROVIDER ?? "mock")
      : (process.env.PAYMENT_MOBILE_PROVIDER ?? "mock");
  return (PROVIDERS[key] ?? PROVIDERS.mock)();
}

/** Fournisseur nommé (pour router un webhook entrant `/api/paiement/webhook/<name>`). */
export function getPaymentProviderByName(name: string): PaymentProvider | null {
  return PROVIDERS[name] ? PROVIDERS[name]() : null;
}

/** Le Mobile Money est-il opérationnel (fournisseur réel + clés présentes) ? */
function mobileMoneyReady(): boolean {
  const p = process.env.PAYMENT_MOBILE_PROVIDER ?? "mock";
  if (p === "cinetpay") return !!process.env.CINETPAY_API_KEY && !!process.env.CINETPAY_SITE_ID;
  if (p === "paydunya") {
    return (
      !!process.env.PAYDUNYA_MASTER_KEY &&
      !!process.env.PAYDUNYA_PRIVATE_KEY &&
      !!process.env.PAYDUNYA_TOKEN
    );
  }
  // Mock : uniquement en dev (jamais afficher un moyen non fonctionnel en prod).
  return p === "mock" && process.env.NODE_ENV !== "production";
}

/** La carte (Stripe) est-elle opérationnelle (clé présente) ? */
function cardReady(): boolean {
  const p = process.env.PAYMENT_CARD_PROVIDER ?? "mock";
  if (p === "stripe") return !!process.env.STRIPE_SECRET_KEY;
  return p === "mock" && process.env.NODE_ENV !== "production";
}

/**
 * Moyens de paiement à afficher : uniquement ceux dont le fournisseur est réellement
 * configuré (clés présentes). En dev (mock), tout est disponible pour tester.
 */
export function getAvailablePaymentMethods(): PaymentMethod[] {
  const methods: PaymentMethod[] = [];
  if (mobileMoneyReady()) methods.push("orange_money", "mtn_momo", "moov_money", "wave");
  if (cardReady()) methods.push("carte");
  return methods;
}
