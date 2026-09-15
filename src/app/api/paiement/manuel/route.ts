import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getPricing } from "@/features/settings/queries";
import { manualChannels } from "@/features/payments/manual";

/**
 * Déclaration d'un paiement mobile money « relais local » : `/api/paiement/manuel`.
 * Le client a payé sur le compte OM/Wave de l'exploitant et déclare l'identifiant
 * de la transaction. On enregistre un paiement `en_attente` qu'un admin validera
 * (aucune vérification automatique possible sur un compte personnel).
 */

const bodySchema = z.object({
  type: z.enum(["activation_candidate", "premium_employeur"]),
  moyen: z.enum(["orange_money", "wave"]),
  // Identifiant de la transaction mobile money (figurant dans le SMS de confirmation).
  transactionId: z.string().trim().min(4).max(40),
  // Numéro depuis lequel le paiement a été envoyé (contexte pour l'admin).
  senderPhone: z.string().trim().max(20).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const { type, moyen } = parsed.data;

  // Le canal doit être configuré (numéro présent).
  if (!manualChannels().some((c) => c.moyen === moyen)) {
    return NextResponse.json({ error: "Moyen de paiement indisponible." }, { status: 503 });
  }

  // Le rôle doit correspondre au type de paiement.
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const roleOk =
    (type === "activation_candidate" && profile?.role === "candidate") ||
    (type === "premium_employeur" && profile?.role === "employer");
  if (!roleOk) return NextResponse.json({ error: "Type de paiement non autorisé pour ce rôle" }, { status: 403 });

  const admin = createAdminClient();

  // Limitation de débit : max 10 déclarations / heure / utilisateur.
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await admin
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneHourAgo);
  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  }

  // Déjà activé, ou une déclaration est déjà en cours de vérification ?
  const { data: existing } = await admin
    .from("payments")
    .select("statut")
    .eq("user_id", user.id)
    .eq("type", type)
    .in("statut", ["reussi", "en_attente"])
    .limit(1)
    .maybeSingle();
  if (existing?.statut === "reussi") {
    return NextResponse.json({ error: "Ce paiement est déjà validé." }, { status: 409 });
  }
  if (existing?.statut === "en_attente") {
    return NextResponse.json({ error: "Un paiement est déjà en cours de vérification." }, { status: 409 });
  }

  // Anti-fraude : un même identifiant de transaction ne peut être déclaré qu'une fois.
  const reference = parsed.data.transactionId.replace(/\s+/g, "");
  const { data: dup } = await admin
    .from("payments")
    .select("id")
    .eq("reference_transaction", reference)
    .limit(1)
    .maybeSingle();
  if (dup) {
    return NextResponse.json({ error: "Cet identifiant de transaction a déjà été déclaré." }, { status: 409 });
  }

  // Tarif de confiance (réglages), jamais un montant fourni par le client.
  const pricing = await getPricing();
  const montant = type === "activation_candidate" ? pricing.activationCandidate : pricing.premiumEmployeur;

  await admin.from("payments").insert({
    user_id: user.id,
    montant,
    moyen,
    type,
    reference_transaction: reference,
    provider_token: parsed.data.senderPhone ?? null, // numéro émetteur déclaré (contexte admin)
    statut: "en_attente",
  });

  return NextResponse.json({ status: "en_attente" });
}
