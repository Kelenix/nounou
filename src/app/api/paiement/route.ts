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
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const roleOk =
    (type === "activation_candidate" && profile?.role === "candidate") ||
    (type === "premium_employeur" && profile?.role === "employer");
  if (!roleOk) {
    return NextResponse.json({ error: "Type de paiement non autorisé pour ce rôle" }, { status: 403 });
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
  let result: InitiatePaymentResult;
  try {
    result = await getPaymentProvider(moyen).initiate({ userId: user.id, montant, moyen, type, phone });
  } catch (e) {
    console.error("[paiement] initiation échouée", e);
    return NextResponse.json({ error: "Paiement indisponible pour le moment." }, { status: 502 });
  }

  // Enregistre la transaction (statut = en_attente pour un vrai fournisseur, reussi pour le mock).
  await admin.from("payments").insert({
    user_id: user.id,
    montant,
    moyen,
    type,
    reference_transaction: result.reference,
    statut: result.status,
  });

  // Vrai fournisseur : rediriger vers la page de paiement hébergée. L'activation se fera
  // au retour du webhook signé (jamais sur la seule réponse d'initiation).
  if (result.redirectUrl) {
    return NextResponse.json({ status: result.status, redirectUrl: result.redirectUrl });
  }

  // Mock : paiement immédiatement réussi → appliquer les effets tout de suite.
  if (result.status === "reussi") {
    await applyPaymentSuccess(admin, user.id, type, montant);
  }

  return NextResponse.json({ status: result.status, montant });
}
