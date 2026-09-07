import "server-only";

import type { createAdminClient } from "@/lib/supabase/server";
import type { PaymentRow, PaymentType } from "@/lib/supabase/database.types";
import type { PaymentProvider } from "@/features/payments/provider";
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

/** Issue d'une réconciliation d'une transaction contre le statut réel du fournisseur. */
export type ReconcileOutcome =
  | "confirmed" // était en attente → confirmée réussie (effets appliqués)
  | "failed" // était en attente → marquée échouée
  | "consistent" // déjà cohérente avec le fournisseur
  | "mismatch" // marquée réussie chez nous mais NON acceptée côté fournisseur (à examiner)
  | "unverifiable"; // pas de référence ou fournisseur sans API de contrôle

export type ReconcileResult = { reference: string | null; outcome: ReconcileOutcome; changed: boolean };

/**
 * Réconcilie une transaction avec le statut réel du fournisseur (CinetPay…).
 * Rattrape les webhooks perdus (paiement abouti mais profil non activé) et
 * signale les incohérences (marqué réussi chez nous sans acceptation fournisseur).
 * N'inverse JAMAIS automatiquement un « réussi » : cela requiert un examen humain.
 */
export async function reconcilePayment(
  admin: Admin,
  provider: PaymentProvider,
  payment: Pick<PaymentRow, "reference_transaction" | "statut">,
): Promise<ReconcileResult> {
  const reference = payment.reference_transaction;
  if (!reference || !provider.checkStatus) {
    return { reference, outcome: "unverifiable", changed: false };
  }

  const real = await provider.checkStatus(reference);
  if (!real) return { reference, outcome: "unverifiable", changed: false };

  if (real.success) {
    if (payment.statut === "reussi") return { reference, outcome: "consistent", changed: false };
    await confirmPayment(admin, reference, true); // en attente/échouée → réussie + effets
    return { reference, outcome: "confirmed", changed: true };
  }

  // Fournisseur : pas (encore) accepté.
  if (payment.statut === "reussi") {
    return { reference, outcome: "mismatch", changed: false }; // signalé, non modifié
  }
  if (payment.statut === "en_attente") {
    await confirmPayment(admin, reference, false); // en attente → échouée
    return { reference, outcome: "failed", changed: true };
  }
  return { reference, outcome: "consistent", changed: false };
}
