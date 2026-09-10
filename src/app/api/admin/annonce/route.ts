import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  titre: z.string().trim().min(3).max(120),
  message: z.string().trim().min(3).max(1000),
});

const CHUNK = 500;

/**
 * Annonce système : envoie une notification (cloche + e-mail via le webhook) à
 * TOUS les utilisateurs actifs. Réservé au Super Admin (diffusion de masse).
 */
export async function POST(request: Request) {
  const me = await getCurrentProfile();
  if (!me || me.role !== "admin" || !me.is_super_admin) {
    return NextResponse.json({ error: "Réservé au Super Admin" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Titre ou message invalide" }, { status: 400 });
  }
  const { titre, message } = parsed.data;

  const admin = createAdminClient();
  // Destinataires : tous les comptes non suspendus.
  const { data: recipients, error } = await admin
    .from("profiles")
    .select("id")
    .eq("is_suspended", false)
    .is("deleted_at", null);
  if (error) {
    return NextResponse.json({ error: "Chargement des destinataires impossible" }, { status: 500 });
  }

  const ids = (recipients ?? []).map((r) => r.id);
  for (let i = 0; i < ids.length; i += CHUNK) {
    const rows = ids.slice(i, i + CHUNK).map((user_id) => ({
      user_id,
      type: "systeme" as const,
      titre,
      message,
    }));
    const { error: insErr } = await admin.from("notifications").insert(rows);
    if (insErr) {
      return NextResponse.json({ error: "Envoi partiel : réessayez", sent: i }, { status: 500 });
    }
  }

  await logAudit(me, "broadcast", { details: { count: ids.length } });
  return NextResponse.json({ ok: true, count: ids.length });
}
