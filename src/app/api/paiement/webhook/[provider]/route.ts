import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getPaymentProviderByName } from "@/features/payments/provider";
import { confirmPayment } from "@/features/payments/confirm";

/**
 * Webhook de confirmation de paiement : `/api/paiement/webhook/<cinetpay|paydunya|stripe>`.
 * Chaque fournisseur vérifie sa propre signature dans `parseWebhook`. On n'active le
 * compte qu'ici, jamais sur la réponse d'initiation.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: name } = await params;
  const provider = getPaymentProviderByName(name);
  if (!provider) {
    return NextResponse.json({ error: "Fournisseur inconnu" }, { status: 404 });
  }

  let event;
  try {
    event = await provider.parseWebhook(request);
  } catch (e) {
    console.error(`[webhook ${name}] erreur`, e);
    return NextResponse.json({ error: "Webhook invalide" }, { status: 400 });
  }

  // Signature absente/invalide ou événement non pertinent : on accuse réception sans agir.
  if (!event) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const admin = createAdminClient();
  await confirmPayment(admin, event.reference, event.success);
  return NextResponse.json({ received: true });
}
