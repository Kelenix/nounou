import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  getPaymentProvider,
  getAvailablePaymentMethods,
  type InitiatePaymentResult,
} from "@/features/payments/provider";
import { applyPaymentSuccess } from "@/features/payments/confirm";
import type { PaymentType } from "@/lib/supabase/database.types";

const bodySchema = z.object({
  type: z.enum(["activation_candidate", "premium_employeur"]),
  moyen: z.enum(["orange_money", "mtn_momo", "moov_money", "wave", "carte"]),
  // Le téléphone n'est requis que pour le Mobile Money (pas pour la carte).
  phone: z.string().trim().min(8).max(20).optional(),
  // Code OTP (Orange Money CI via SOFTPAY : le client le génère avec #144*82#).
  otp: z.string().trim().max(12).optional(),
});

const SETTING_KEY: Record<PaymentType, string> = {
  activation_candidate: "prix_activation_candidate",
  premium_employeur: "prix_premium_employeur",
};

const DEFAULT_PRICE: Record<PaymentType, number> = {
  activation_candidate: 1000,
  premium_employeur: 2000,
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { type, moyen } = parsed.data;
  const phone = parsed.data.phone ?? "";

  // Refuse un moyen dont le fournisseur n'est pas configuré (empêche une activation
  // « gratuite » via le mock en production si les clés sont absentes).
  if (!getAvailablePaymentMethods().includes(moyen)) {
    return NextResponse.json({ error: "Moyen de paiement indisponible." }, { status: 503 });
  }

  // Le Mobile Money exige un numéro ; la carte (Stripe) non.
  if (moyen !== "carte" && phone.length < 8) {
    return NextResponse.json({ error: "Numéro Mobile Money requis" }, { status: 400 });
  }

  // Vérifie que le rôle correspond au type de paiement.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, prenom, nom")
    .eq("id", user.id)
    .maybeSingle();
  const roleOk =
    (type === "activation_candidate" && profile?.role === "candidate") ||
    (type === "premium_employeur" && profile?.role === "employer");
  if (!roleOk) {
    return NextResponse.json({ error: "Type de paiement non autorisé pour ce rôle" }, { status: 403 });
  }

  // SOFTPAY Orange Money CI exige un code OTP (généré par le client via #144*82#).
  const provider = getPaymentProvider(moyen);
  if (provider.name === "paydunya" && moyen === "orange_money" && (parsed.data.otp ?? "").length < 4) {
    return NextResponse.json(
      { error: "Code Orange Money requis. Composez #144*82# (option 2) pour l'obtenir." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Limitation de débit (S5) : max 10 tentatives de paiement / heure / utilisateur.
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count: recentAttempts } = await admin
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneHourAgo);
  if ((recentAttempts ?? 0) >= 10) {
    return NextResponse.json(
      { error: "Trop de tentatives de paiement. Réessayez plus tard." },
      { status: 429 },
    );
  }

  // Tarif depuis settings (repli sur défaut).
  const { data: setting } = await admin
    .from("settings")
    .select("value")
    .eq("key", SETTING_KEY[type])
    .maybeSingle();
  const montant = setting ? Number(setting.value) : DEFAULT_PRICE[type];

  // Initiation via le fournisseur (mock par défaut ; réel = CinetPay/PayDunya/Stripe).
  const customerName = `${profile?.prenom ?? ""} ${profile?.nom ?? ""}`.trim() || undefined;
  let result: InitiatePaymentResult;
  try {
    result = await provider.initiate({
      userId: user.id,
      montant,
      moyen,
      type,
      phone,
      customerName,
      customerEmail: user.email ?? undefined,
      otp: parsed.data.otp,
    });
  } catch (e) {
    console.error("[paiement] initiation échouée", e);
    return NextResponse.json({ error: "Paiement indisponible pour le moment." }, { status: 502 });
  }

  // Enregistre la transaction (en_attente = à confirmer par IPN ; echoue = refus opérateur ;
  // reussi = mock immédiat).
  await admin.from("payments").insert({
    user_id: user.id,
    montant,
    moyen,
    type,
    reference_transaction: result.reference,
    provider_token: result.providerToken ?? null,
    statut: result.status,
  });

  // Refus opérateur (OTP invalide, délai dépassé…) : renvoyer le motif à afficher.
  if (result.status === "echoue") {
    return NextResponse.json({ error: result.message ?? "Paiement refusé." }, { status: 400 });
  }

  // Wave / page hébergée : rediriger. L'activation se fera au retour du webhook signé.
  if (result.redirectUrl) {
    return NextResponse.json({
      status: result.status,
      reference: result.reference,
      redirectUrl: result.redirectUrl,
    });
  }

  // Mock : paiement immédiatement réussi → appliquer les effets tout de suite.
  if (result.status === "reussi") {
    await applyPaymentSuccess(admin, user.id, type, montant);
  }

  // SOFTPAY (Orange/MTN/Moov) : en attente de validation sur le téléphone → l'app interroge
  // /api/paiement/statut jusqu'à confirmation par l'IPN.
  return NextResponse.json({
    status: result.status,
    reference: result.reference,
    montant,
    message: result.message ?? null,
  });
}
