import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { logAudit, STAFF_SECTIONS } from "@/lib/admin";

const VALID = STAFF_SECTIONS.map((s) => s.key) as [string, ...string[]];

const bodySchema = z.object({
  userId: z.string().uuid(),
  permissions: z.array(z.enum(VALID)).max(20),
});

export async function POST(request: Request) {
  const me = await getCurrentProfile();
  // Seul le Super Admin gère les permissions du staff.
  if (!me || me.role !== "admin" || !me.is_super_admin) {
    return NextResponse.json({ error: "Réservé au Super Admin" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { userId, permissions } = parsed.data;

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("role, is_super_admin, prenom, nom")
    .eq("id", userId)
    .maybeSingle();
  if (!target || target.role !== "admin" || target.is_super_admin) {
    return NextResponse.json({ error: "Cible invalide" }, { status: 400 });
  }

  await admin.from("profiles").update({ staff_permissions: permissions }).eq("id", userId);
  await logAudit(me, "set_permissions", {
    targetId: userId,
    targetName: `${target.prenom ?? ""} ${target.nom ?? ""}`.trim() || "Admin",
    details: { permissions },
  });
  return NextResponse.json({ ok: true });
}
