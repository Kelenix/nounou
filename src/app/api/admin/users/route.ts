import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin";

const bodySchema = z.object({
  action: z.enum(["delete", "cancel_subscription", "set_role", "suspend"]),
  userId: z.string().uuid(),
  role: z.enum(["candidate", "employer", "admin"]).optional(),
  suspended: z.boolean().optional(),
});

export async function POST(request: Request) {
  const me = await getCurrentProfile();
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { action, userId, role, suspended } = parsed.data;

  if (userId === me.id) {
    return NextResponse.json({ error: "Action impossible sur votre propre compte" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("role, is_super_admin, prenom, nom")
    .eq("id", userId)
    .maybeSingle();
  if (!target) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
  const targetName = `${target.prenom ?? ""} ${target.nom ?? ""}`.trim() || "Utilisateur";

  // Protection absolue du Super Admin.
  if (target.is_super_admin) {
    return NextResponse.json({ error: "Le Super Admin est protégé et ne peut pas être modifié" }, { status: 403 });
  }

  // Hiérarchie : seul le Super Admin gère les administrateurs.
  if (target.role === "admin" && !me.is_super_admin) {
    return NextResponse.json({ error: "Seul le Super Admin peut gérer les administrateurs" }, { status: 403 });
  }

  // Permission « users » requise (le Super Admin a tout).
  const canUsers = me.is_super_admin || (me.staff_permissions ?? []).includes("users");
  if (!canUsers) {
    return NextResponse.json({ error: "Vous n'avez pas la permission de gérer les utilisateurs" }, { status: 403 });
  }

  if (action === "set_role") {
    if (!role) return NextResponse.json({ error: "Rôle manquant" }, { status: 400 });
    // Seul le Super Admin peut promouvoir un compte administrateur.
    if (role === "admin" && !me.is_super_admin) {
      return NextResponse.json({ error: "Seul le Super Admin peut nommer un administrateur" }, { status: 403 });
    }
    await admin.from("profiles").update({ role, staff_permissions: [] }).eq("id", userId);
    if (role === "candidate") await admin.from("candidate_profiles").upsert({ user_id: userId });
    else if (role === "employer") await admin.from("employer_profiles").upsert({ user_id: userId });
    await logAudit(me, "set_role", { targetId: userId, targetName, details: { role } });
    return NextResponse.json({ ok: true });
  }

  if (action === "suspend") {
    await admin.from("profiles").update({ is_suspended: !!suspended }).eq("id", userId);
    await logAudit(me, suspended ? "suspend" : "reactivate", { targetId: userId, targetName });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
    }
    await logAudit(me, "delete_user", { targetId: userId, targetName });
    return NextResponse.json({ ok: true });
  }

  // cancel_subscription
  if (target.role === "candidate") {
    await admin.from("candidate_profiles").update({ is_active_paid: false }).eq("user_id", userId);
  } else if (target.role === "employer") {
    await admin.from("employer_profiles").update({ is_premium: false }).eq("user_id", userId);
  }
  await logAudit(me, "cancel_subscription", { targetId: userId, targetName });
  return NextResponse.json({ ok: true });
}
