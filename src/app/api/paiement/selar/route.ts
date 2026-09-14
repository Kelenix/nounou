import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { getPricing } from "@/features/settings/queries";
import { applyPaymentSuccess } from "@/features/payments/confirm";
import type { PaymentType } from "@/lib/supabase/database.types";

/**
 * Webhook Selar : `/api/paiement/selar`.
 *
 * Selar (plateforme créateur, ouverte aux particuliers sans entreprise) encaisse
 * le paiement ; à la vente, un webhook natif Selar OU un Zap « New Sale » POSTe
 * ici. On identifie l'acheteur par e-mail (il doit payer avec l'e-mail de son
 * compte), on vérifie un secret partagé, puis on active le profil.
 *
 * Sécurité : sans le bon secret, aucune activation (sinon n'importe qui pourrait
 * activer un compte gratuitement). On ne fait JAMAIS confiance au montant envoyé
 * par Selar : le tarif vient de `settings` (getPricing).
 *
 * Idempotent : une vente déjà traitée (même référence) n'est pas rejouée — les
 * webhooks/Zaps peuvent être renvoyés plusieurs fois.
 */

const bodySchema = z.object({
  email: z.string().email(),
  // Nom/slug/id du produit Selar (sert à distinguer activation vs premium).
  product: z.string().trim().min(1),
  // Référence de commande Selar (idempotence). Optionnelle : repli déterministe.
  reference: z.string().trim().max(160).optional(),
});

function secretOk(received: string | null): boolean {
  const expected = process.env.SELAR_WEBHOOK_SECRET ?? "";
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Associe le libellé de produit Selar reçu au type de paiement interne. */
function matchType(product: string): PaymentType | null {
  const p = product.toLowerCase();
  const activation = (process.env.SELAR_PRODUCT_ACTIVATION ?? "").toLowerCase().trim();
  const premium = (process.env.SELAR_PRODUCT_PREMIUM ?? "").toLowerCase().trim();
  if (activation && p.includes(activation)) return "activation_candidate";
  if (premium && p.includes(premium)) return "premium_employeur";
  return null;
}

/** Lit le corps en JSON ou en form-urlencoded (selon la source Selar/Zapier). */
async function readBody(request: Request): Promise<unknown> {
  const ctype = request.headers.get("content-type") ?? "";
  if (ctype.includes("application/json")) return request.json().catch(() => null);
  if (ctype.includes("form")) {
    const form = await request.formData().catch(() => null);
    return form ? Object.fromEntries(form.entries()) : null;
  }
  // Repli : tenter le JSON.
  return request.json().catch(() => null);
}

export async function POST(request: Request) {
  // Le secret peut arriver en en-tête (webhook natif) ou dans l'URL (?secret=, pratique via Zapier).
  const headerSecret = request.headers.get("x-selar-secret");
  const urlSecret = new URL(request.url).searchParams.get("secret");
  if (!process.env.SELAR_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Selar non configuré" }, { status: 503 });
  }
  if (!secretOk(headerSecret ?? urlSecret)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await readBody(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { email, product } = parsed.data;

  const type = matchType(product);
  if (!type) {
    // Produit non mappé : on accuse réception sans agir (évite les renvois Zapier).
    return NextResponse.json({ received: true, ignored: "unknown_product" });
  }

  const admin = createAdminClient();

  // Retrouve le compte par e-mail (fonction serveur existante, réservée au service_role).
  const { data: userId } = await admin.rpc("admin_user_id_by_email", { p_email: email });
  if (!userId) {
    // L'acheteur a payé avec un e-mail sans compte : à signaler (support), pas d'activation.
    console.warn("[selar] vente sans compte correspondant", { email, product });
    return NextResponse.json({ received: true, ignored: "no_account" });
  }

  // Le type doit correspondre au rôle du compte.
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  const roleOk =
    (type === "activation_candidate" && profile?.role === "candidate") ||
    (type === "premium_employeur" && profile?.role === "employer");
  if (!roleOk) {
    console.warn("[selar] rôle incompatible avec le produit", { userId, role: profile?.role, type });
    return NextResponse.json({ received: true, ignored: "role_mismatch" });
  }

  // Tarif de confiance : depuis les réglages, jamais le montant envoyé par Selar.
  const pricing = await getPricing();
  const montant = type === "activation_candidate" ? pricing.activationCandidate : pricing.premiumEmployeur;

  // Idempotence : une même vente (référence) n'est traitée qu'une fois.
  const reference = parsed.data.reference?.trim() || `selar:${type}:${userId}`;
  const { data: existing } = await admin
    .from("payments")
    .select("id, statut")
    .eq("reference_transaction", reference)
    .maybeSingle();
  if (existing?.statut === "reussi") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (existing) {
    await admin.from("payments").update({ statut: "reussi" }).eq("id", existing.id);
  } else {
    await admin.from("payments").insert({
      user_id: userId,
      montant,
      moyen: "selar",
      type,
      reference_transaction: reference,
      statut: "reussi",
    });
  }

  await applyPaymentSuccess(admin, userId, type, montant);
  return NextResponse.json({ received: true, activated: true });
}
