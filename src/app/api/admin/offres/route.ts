import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ offerId: z.string().uuid() });

/**
 * Suppression d'une offre par un administrateur (modération).
 * Réservé aux admins disposant de la permission « offers » (le Super Admin a tout).
 */
export async function POST(request: Request) {
  const me = await getCurrentProfile();
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const canOffers = me.is_super_admin || (me.staff_permissions ?? []).includes("offers");
  if (!canOffers) {
    return NextResponse.json({ error: "Vous n'avez pas la permission de gérer les offres" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: offer } = await admin
    .from("offers")
    .select("titre")
    .eq("id", parsed.data.offerId)
    .maybeSingle();
  if (!offer) {
    return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
  }

  await admin.from("offers").delete().eq("id", parsed.data.offerId);
  await logAudit(me, "delete_offer", { targetId: parsed.data.offerId, targetName: offer.titre });
  return NextResponse.json({ ok: true });
}
