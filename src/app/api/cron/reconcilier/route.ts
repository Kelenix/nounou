import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { reconcileStuckPayments } from "@/features/payments/confirm";

export const dynamic = "force-dynamic";

/** Comparaison à temps constant du jeton Bearer avec le secret attendu. */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Réconciliation automatique (cron quotidien du VPS).
 * Re-vérifie auprès du fournisseur toutes les transactions « en attente » bloquées et
 * rattrape les confirmations perdues, sans intervention manuelle.
 * Protégé par `CRON_SECRET` (en-tête `Authorization: Bearer <secret>`).
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { checked, counts } = await reconcileStuckPayments(admin);

  // Journalise l'exécution (acteur « système », actor_id null autorisé).
  await admin.from("admin_audit_log").insert({
    actor_id: null,
    actor_name: "Système (cron)",
    action: "reconcile_payments",
    details: { scope: "cron", checked, ...counts },
  });

  return NextResponse.json({ ok: true, checked, counts });
}
