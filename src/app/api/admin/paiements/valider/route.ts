import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin";
import { applyPaymentSuccess } from "@/features/payments/confirm";

/**
 * Validation manuelle d'un paiement mobile money « relais local » par le Super
 * Admin : `/api/admin/paiements/valider`. Confirmer → active le profil ;
 * rejeter → marque la transaction échouée. Réservé au Super Admin, idempotent
 * (seule une transaction encore « en attente » peut être traitée).
 */

const bodySchema = z.object({
  paymentId: z.string().uuid(),
  decision: z.enum(["confirm", "reject"]),
});

export async function POST(request: Request) {
  const me = await getCurrentProfile();
  if (!me || me.role !== "admin" || !me.is_super_admin) {
    return NextResponse.json({ error: "Réservé au Super Admin" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const { paymentId, decision } = parsed.data;

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("id, user_id, type, montant, statut")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment) return NextResponse.json({ error: "Transaction introuvable" }, { status: 404 });
  if (payment.statut !== "en_attente") {
    return NextResponse.json({ error: "Transaction déjà traitée." }, { status: 409 });
  }

  if (decision === "confirm") {
    await admin.from("payments").update({ statut: "reussi" }).eq("id", payment.id);
    await applyPaymentSuccess(admin, payment.user_id, payment.type, payment.montant);
  } else {
    await admin.from("payments").update({ statut: "echoue" }).eq("id", payment.id);
  }

  await logAudit(me, "validate_manual_payment", {
    details: { paymentId, decision, montant: payment.montant, type: payment.type },
  });

  return NextResponse.json({ ok: true, decision });
}
