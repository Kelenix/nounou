import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin";
import { getPaymentProvider } from "@/features/payments/provider";
import { reconcilePayment, type ReconcileOutcome } from "@/features/payments/confirm";

// Transactions « en attente » plus vieilles que ce délai = webhook probablement perdu.
const STUCK_AFTER_MS = 10 * 60 * 1000;
const MAX_BATCH = 100;

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

  // Sélection des transactions à réconcilier.
  let query = admin
    .from("payments")
    .select("id, moyen, statut, reference_transaction")
    .not("reference_transaction", "is", null)
    .limit(MAX_BATCH);
  if (parsed.data.reference) {
    query = query.eq("reference_transaction", parsed.data.reference);
  } else {
    // Lot : uniquement les paiements « en attente » assez anciens pour être considérés bloqués.
    const cutoff = new Date(Date.now() - STUCK_AFTER_MS).toISOString();
    query = query.eq("statut", "en_attente").lte("created_at", cutoff);
  }
  const { data: payments } = await query;

  const counts: Record<ReconcileOutcome, number> = {
    confirmed: 0,
    failed: 0,
    consistent: 0,
    mismatch: 0,
    unverifiable: 0,
  };

  for (const p of payments ?? []) {
    try {
      const r = await reconcilePayment(admin, getPaymentProvider(p.moyen), p);
      counts[r.outcome] += 1;
    } catch (e) {
      console.error("[reconciliation] échec pour", p.reference_transaction, e);
      counts.unverifiable += 1;
    }
  }

  const checked = (payments ?? []).length;
  await logAudit(me, "reconcile_payments", {
    details: { scope: parsed.data.reference ?? "pending", checked, ...counts },
  });

  return NextResponse.json({ ok: true, checked, counts });
}
