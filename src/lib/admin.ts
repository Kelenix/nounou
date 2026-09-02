import "server-only";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { canAccess, type StaffSection } from "@/lib/admin-permissions";
import type { ProfileRow } from "@/lib/supabase/database.types";

export { STAFF_SECTIONS } from "@/lib/admin-permissions";

/** Exige un admin ; renvoie le profil. Redirige sinon (via requireRole). */
export async function requireAdmin(): Promise<ProfileRow> {
  return requireRole("admin");
}

/** Exige l'accès à une section admin ; redirige vers /admin si non autorisé. */
export async function requireAdminSection(section: StaffSection): Promise<ProfileRow> {
  const profile = await requireRole("admin");
  if (!canAccess(profile, section)) redirect("/admin");
  return profile;
}

/** Exige le Super Admin ; redirige vers /admin sinon. */
export async function requireSuperAdmin(): Promise<ProfileRow> {
  const profile = await requireRole("admin");
  if (!profile.is_super_admin) redirect("/admin");
  return profile;
}

/** Enregistre une action sensible dans le journal d'audit (via service_role). */
export async function logAudit(
  actor: Pick<ProfileRow, "id" | "prenom" | "nom">,
  action: string,
  opts: { targetId?: string; targetName?: string; details?: Record<string, unknown> } = {},
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("admin_audit_log").insert({
    actor_id: actor.id,
    actor_name: `${actor.prenom ?? ""} ${actor.nom ?? ""}`.trim() || "Admin",
    action,
    target_id: opts.targetId ?? null,
    target_name: opts.targetName ?? null,
    details: opts.details ?? null,
  });
}
