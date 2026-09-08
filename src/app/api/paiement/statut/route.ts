import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Statut d'une transaction de l'utilisateur (pour le suivi SOFTPAY côté client).
 * L'IPN met à jour le statut en base ; l'app interroge ici jusqu'à `reussi`/`echoue`.
 * Ne renvoie que les transactions appartenant à l'utilisateur connecté.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const reference = new URL(request.url).searchParams.get("reference");
  if (!reference) return NextResponse.json({ error: "Référence manquante" }, { status: 400 });

  const { data: payment } = await supabase
    .from("payments")
    .select("statut")
    .eq("reference_transaction", reference)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!payment) return NextResponse.json({ error: "Transaction introuvable" }, { status: 404 });
  return NextResponse.json({ statut: payment.statut });
}
