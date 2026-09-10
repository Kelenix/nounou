import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { purgeDeletedAccounts } from "@/features/account/purge";

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
 * Purge/anonymisation des comptes supprimés (cron du VPS).
 * Anonymise les comptes en suppression douce dont la durée de conservation est
 * écoulée, tout en conservant les enregistrements financiers/modération liés.
 * Idempotent (`anonymized_at`). Protégé par `CRON_SECRET`.
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const admin = createAdminClient();
  const res = await purgeDeletedAccounts(admin);

  await admin.from("admin_audit_log").insert({
    actor_id: null,
    actor_name: "Système (cron)",
    action: "purge_comptes",
    details: { scope: "cron", ...res },
  });

  return NextResponse.json({ ok: true, ...res });
}
