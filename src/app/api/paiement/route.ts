import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/features/payments/provider";
import { formatFcfa } from "@/lib/utils";
import type { PaymentType } from "@/lib/supabase/database.types";

const bodySchema = z.object({
  type: z.enum(["activation_candidate", "premium_employeur"]),
  moyen: z.enum(["orange_money", "mtn_momo", "moov_money", "wave"]),
  phone: z.string().trim().min(8).max(20),
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
  const { type, moyen, phone } = parsed.data;

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

  // Initiation via le provider (mock en dev).
  const result = await getPaymentProvider().initiate({
    userId: user.id,
    montant,
    moyen,
    type,
    phone,
  });

  // Enregistre la transaction.
  await admin.from("payments").insert({
    user_id: user.id,
    montant,
    moyen,
    type,
    reference_transaction: result.reference,
    statut: result.status,
  });

  // Applique les effets si réussi (simule le callback de l'agrégateur).
  if (result.status === "reussi") {
    if (type === "activation_candidate") {
      await admin.from("candidate_profiles").update({ is_active_paid: true }).eq("user_id", user.id);
    } else {
      await admin.from("employer_profiles").update({ is_premium: true }).eq("user_id", user.id);
    }
    await admin.from("notifications").insert({
      user_id: user.id,
      type: "paiement_confirme",
      titre: "Paiement confirmé",
      message: `Votre paiement de ${formatFcfa(montant)} a été confirmé.`,
    });
  }

  return NextResponse.json({ status: result.status, montant });
}
