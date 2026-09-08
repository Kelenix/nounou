import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin";
import { getPaymentProvider } from "@/features/payments/provider";
import {
  reconcilePayment,
  reconcileStuckPayments,
  type ReconcileCounts,
} from "@/features/payments/confirm";

const bodySchema = z.object({
  // Réconcilier une transaction précise, ou toutes les transactions bloquées si absent.
  reference: z.string().trim().min(1).max(120).optional(),
});

export async function POST(request: Request) {
  const me = await getCurrentProfile();
  if (!me || me.role !== "admin" || !me.is_super_admin) {
    return NextResponse.json({ error: "Réservé au Super Admin" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const admin = createAdminClient();
  const reference = parsed.data.reference;

  let checked: number;
  let counts: ReconcileCounts;

  if (reference) {
    // Vérification d'une transaction précise.
    const { data: payment } = await admin
      .from("payments")
      .select("moyen, statut, reference_transaction, provider_token")
      .eq("reference_transaction", reference)
      .maybeSingle();
    counts = { confirmed: 0, failed: 0, consistent: 0, mismatch: 0, unverifiable: 0 };
    if (payment) {
      try {
        const r = await reconcilePayment(admin, getPaymentProvider(payment.moyen), payment);
        counts[r.outcome] += 1;
      } catch (e) {
        console.error("[reconciliation] échec pour", reference, e);
        counts.unverifiable += 1;
      }
    }
    checked = payment ? 1 : 0;
  } else {
    // Lot : toutes les transactions « en attente » bloquées.
    ({ checked, counts } = await reconcileStuckPayments(admin));
  }

  await logAudit(me, "reconcile_payments", {
    details: { scope: reference ?? "pending", checked, ...counts },
  });

  return NextResponse.json({ ok: true, checked, counts });
}
