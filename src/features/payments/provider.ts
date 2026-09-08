import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentMethod, PaymentStatus, PaymentType } from "@/lib/supabase/database.types";

export type InitiatePaymentInput = {
  userId: string;
  montant: number;
  moyen: PaymentMethod;
  type: PaymentType;
  phone: string;
  /** Nom du payeur (requis par SOFTPAY PayDunya). */
  customerName?: string;
  /** Email du payeur (requis par SOFTPAY PayDunya). */
  customerEmail?: string;
  /** Code OTP saisi par le client (Orange Money CI uniquement, via #144*82#). */
  otp?: string;
};

export type InitiatePaymentResult = {
  reference: string;
  status: PaymentStatus;
  /** URL de paiement hébergée (agrégateur/Stripe) vers laquelle rediriger l'utilisateur. */
  redirectUrl?: string;
  /** Jeton d'invoice du fournisseur, à conserver pour la réconciliation (ex. token PayDunya). */
  providerToken?: string | null;
  /** Message opérateur à afficher (ex. « validez sur votre téléphone » ou motif d'échec). */
  message?: string;
};

/** Identifiants d'une transaction pour interroger le fournisseur (réconciliation). */
export type PaymentRef = {
  /** Notre référence interne (transaction_id envoyé au fournisseur). */
  reference: string;
  /** Jeton d'invoice du fournisseur, si conservé à l'initiation. */
  providerToken: string | null;
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
  /**
   * Interroge le fournisseur sur le statut réel d'une transaction (réconciliation).
   * `null` = statut non déterminable automatiquement (fournisseur sans API de contrôle,
   * ou jeton manquant).
   */
  checkStatus?(ref: PaymentRef): Promise<PaymentWebhookEvent | null>;
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

  async checkStatus(ref: PaymentRef): Promise<PaymentWebhookEvent | null> {
    return { reference: ref.reference, success: true };
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
    return this.checkStatus({ reference, providerToken: null });
  }

  async checkStatus(ref: PaymentRef): Promise<PaymentWebhookEvent | null> {
    const reference = ref.reference;
    const { apikey, site_id } = this.creds();
    const res = await fetch(`${CinetPayProvider.BASE}/payment/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apikey, site_id, transaction_id: reference }),
    });
    const data = await res.json().catch(() => null);
    // 627 = transaction en attente chez CinetPay : on renvoie « pas encore réussi »
    // sans la marquer échouée (elle pourra aboutir plus tard).
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

  // Correspondance moyen (app) → endpoint SOFTPAY PayDunya (Côte d'Ivoire).
  private static readonly SOFTPAY_CI: Record<Exclude<PaymentMethod, "carte">, string> = {
    orange_money: "orange-money-ci",
    mtn_momo: "mtn-ci",
    moov_money: "moov-ci",
    wave: "wave-ci",
  };

  /** Numéro local (sans indicatif) attendu par SOFTPAY. */
  private localPhone(phone: string): string {
    return phone.replace(/^\+?225/, "");
  }

  /** Corps SOFTPAY spécifique à chaque opérateur (noms de champs imposés par PayDunya). */
  private softpayBody(input: InitiatePaymentInput, token: string, name: string, email: string) {
    const phone = this.localPhone(input.phone);
    switch (input.moyen) {
      case "orange_money":
        return {
          orange_money_ci_customer_fullname: name,
          orange_money_ci_email: email,
          orange_money_ci_phone_number: phone,
          orange_money_ci_otp: input.otp ?? "",
          payment_token: token,
        };
      case "mtn_momo":
        return {
          mtn_ci_customer_fullname: name,
          mtn_ci_email: email,
          mtn_ci_phone_number: phone,
          mtn_ci_wallet_provider: "MTNCI",
          payment_token: token,
        };
      case "moov_money":
        return {
          moov_ci_customer_fullname: name,
          moov_ci_email: email,
          moov_ci_phone_number: phone,
          payment_token: token,
        };
      case "wave":
        return {
          wave_ci_fullName: name,
          wave_ci_email: email,
          wave_ci_phone: phone,
          wave_ci_payment_token: token, // Wave utilise un nom de token différent
        };
      default:
        throw new Error("PayDunya : moyen non pris en charge.");
    }
  }

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    if (input.moyen === "carte") throw new Error("PayDunya ne gère pas la carte.");
    const reference = makeReference(input);

    // 1. Création de la facture → token de paiement.
    const invRes = await fetch(`${this.base()}/checkout-invoice/create`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        invoice: { total_amount: input.montant, description: labelForType(input.type) },
        store: { name: "J'ai ma nounou" },
        custom_data: { reference },
        actions: { callback_url: webhookUrl("paydunya"), return_url: returnUrl() },
      }),
    });
    const inv = await invRes.json().catch(() => null);
    const token = inv?.token as string | undefined;
    if (inv?.response_code !== "00" || !token) {
      throw new Error(`PayDunya : création de facture échouée (${inv?.response_text ?? invRes.status})`);
    }

    // 2. SOFTPAY : débit direct via l'opérateur (sans redirection, sauf Wave qui renvoie une URL).
    const name = input.customerName?.trim() || "Client";
    const email = input.customerEmail?.trim() || `${input.userId}@jaimanounou.com`;
    const endpoint = PayDunyaProvider.SOFTPAY_CI[input.moyen];
    const spRes = await fetch(`${this.base()}/softpay/${endpoint}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(this.softpayBody(input, token, name, email)),
    });
    const sp = await spRes.json().catch(() => null);

    // Échec attendu (OTP invalide, délai dépassé, solde insuffisant…) : on renvoie le motif,
    // sans exception (l'utilisateur pourra réessayer). Transaction marquée échouée.
    if (sp?.success !== true) {
      return {
        reference,
        status: "echoue",
        providerToken: token,
        message: (sp?.message as string | undefined) ?? "Paiement refusé par l'opérateur.",
      };
    }

    // Wave CI (et OM QR) : une URL est renvoyée → rediriger le client vers Wave.
    const url = sp?.url as string | undefined;
    if (url) return { reference, status: "en_attente", redirectUrl: url, providerToken: token };

    // MTN/Moov/OM : requête acceptée, validation sur le téléphone → confirmation via IPN.
    return {
      reference,
      status: "en_attente",
      providerToken: token,
      message: (sp?.message as string | undefined) ?? undefined,
    };
  }

  async checkStatus(ref: PaymentRef): Promise<PaymentWebhookEvent | null> {
    // La réconciliation PayDunya passe par le token d'invoice (pas notre référence).
    if (!ref.providerToken) return null;
    const res = await fetch(`${this.base()}/checkout-invoice/confirm/${ref.providerToken}`, {
      method: "GET",
      headers: this.headers(),
    });
    const data = await res.json().catch(() => null);
    if (data?.response_code !== "00") return null; // requête invalide → non déterminable
    return { reference: ref.reference, success: data?.status === "completed" };
  }

  async parseWebhook(request: Request): Promise<PaymentWebhookEvent | null> {
    // PayDunya poste en form-urlencoded (clés `data[...]`).
    const params = new URLSearchParams(await request.text());
    const reference = params.get("data[custom_data][reference]");
    if (!reference) return null;

    // Authenticité : PayDunya envoie `data[hash]` = SHA-512(master_key). On refuse
    // toute notification dont la signature ne correspond pas (anti-falsification).
    const masterKey = requireEnv("PAYDUNYA_MASTER_KEY");
    const received = params.get("data[hash]");
    if (!received) return null;
    const expected = createHash("sha512").update(masterKey).digest("hex");
    const a = Buffer.from(received);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

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
