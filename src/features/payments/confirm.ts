import "server-only";

import type { createAdminClient } from "@/lib/supabase/server";
import type { PaymentType } from "@/lib/supabase/database.types";
import { formatFcfa } from "@/lib/utils";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Applique les effets d'un paiement réussi : activation du profil + notification.
 * Ne PAS appeler directement depuis une réponse d'initiation d'un vrai fournisseur —
 * uniquement après confirmation (mock immédiat, ou webhook signé).
 */
export async function applyPaymentSuccess(
  admin: Admin,
  userId: string,
  type: PaymentType,
  montant: number,
) {
  if (type === "activation_candidate") {
    await admin.from("candidate_profiles").update({ is_active_paid: true }).eq("user_id", userId);
  } else {
    await admin.from("employer_profiles").update({ is_premium: true }).eq("user_id", userId);
  }
  await admin.from("notifications").insert({
    user_id: userId,
    type: "paiement_confirme",
    titre: "Paiement confirmé",
    message: `Votre paiement de ${formatFcfa(montant)} a été confirmé.`,
  });
}

/**
 * Confirme (ou échoue) une transaction depuis un webhook fournisseur.
 * Idempotent : une transaction déjà « réussie » n'est pas retraitée.
 */
export async function confirmPayment(admin: Admin, reference: string, success: boolean) {
  const { data: payment } = await admin
    .from("payments")
    .select("id, user_id, type, montant, statut")
    .eq("reference_transaction", reference)
    .maybeSingle();
  if (!payment || payment.statut === "reussi") return;

  await admin.from("payments").update({ statut: success ? "reussi" : "echoue" }).eq("id", payment.id);
  if (success) {
    await applyPaymentSuccess(admin, payment.user_id, payment.type, payment.montant);
  }
}
