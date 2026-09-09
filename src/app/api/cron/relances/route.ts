import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { runRelances } from "@/features/email/relances";

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
 * Relances e-mail d'onboarding (cron du VPS).
 * Envoie, selon une séquence espacée et plafonnée (J+0/1/3/7), un rappel aux comptes
 * dont l'inscription est incomplète, ou aux candidats dont l'activation n'est pas payée.
 * Idempotent : réexécuter la même journée n'envoie rien de plus.
 * Protégé par `CRON_SECRET` (en-tête `Authorization: Bearer <secret>`).
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const admin = createAdminClient();
  const res = await runRelances(admin);

  await admin.from("admin_audit_log").insert({
    actor_id: null,
    actor_name: "Système (cron)",
    action: "email_relances",
    details: { scope: "cron", ...res },
  });

  return NextResponse.json({ ok: true, ...res });
}
