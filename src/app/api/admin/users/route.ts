import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin";

const bodySchema = z.object({
  action: z.enum(["delete", "restore", "cancel_subscription", "activate_subscription", "set_role", "suspend"]),
  userId: z.string().uuid(),
  role: z.enum(["candidate", "employer", "admin"]).optional(),
  suspended: z.boolean().optional(),
});

// Bannissement auth « permanent » (100 ans) : bloque toute connexion d'un compte supprimé.
const BAN_FOREVER = "876000h";

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
    .select("role, is_super_admin, prenom, nom, anonymized_at")
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
    await admin.from("notifications").insert({
      user_id: userId,
      type: "systeme",
      titre: "Votre rôle a été mis à jour",
      message: "Un administrateur a modifié le rôle associé à votre compte.",
    });
    await logAudit(me, "set_role", { targetId: userId, targetName, details: { role } });
    return NextResponse.json({ ok: true });
  }

  if (action === "suspend") {
    await admin.from("profiles").update({ is_suspended: !!suspended }).eq("id", userId);
    // Bloque (ou rétablit) réellement la connexion : un compte suspendu ne peut plus
    // ni se connecter ni valider un code OTP (bannissement auth).
    await admin.auth.admin.updateUserById(userId, { ban_duration: suspended ? BAN_FOREVER : "none" });
    await admin.from("notifications").insert({
      user_id: userId,
      type: "systeme",
      titre: suspended ? "Compte suspendu" : "Compte réactivé",
      message: suspended
        ? "Votre compte a été suspendu. Contactez le support pour plus d'informations."
        : "Votre compte a été réactivé : vous pouvez de nouveau utiliser le service.",
    });
    await logAudit(me, suspended ? "suspend" : "reactivate", { targetId: userId, targetName });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    // Suppression DOUCE : on conserve le compte et son historique (paiements, avis,
    // signalements) pour la traçabilité, mais on bannit la connexion et on le masque
    // partout. L'anonymisation (effacement des données perso) intervient plus tard,
    // via le cron de purge, après la durée de conservation.
    await admin
      .from("profiles")
      .update({ deleted_at: new Date().toISOString(), deleted_by: me.id, is_suspended: true })
      .eq("id", userId);
    const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: BAN_FOREVER });
    if (error) {
      return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
    }
    await logAudit(me, "delete_user", { targetId: userId, targetName });
    return NextResponse.json({ ok: true });
  }

  if (action === "restore") {
    // Restauration d'un compte supprimé (impossible une fois anonymisé).
    if (target.anonymized_at) {
      return NextResponse.json({ error: "Compte anonymisé : restauration impossible" }, { status: 400 });
    }
    await admin
      .from("profiles")
      .update({ deleted_at: null, deleted_by: null, deletion_reason: null, is_suspended: false })
      .eq("id", userId);
    await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
    await logAudit(me, "restore_user", { targetId: userId, targetName });
    return NextResponse.json({ ok: true });
  }

  // activate_subscription : activation MANUELLE par un admin (accès offert, sans paiement).
  if (action === "activate_subscription") {
    if (target.role === "candidate") {
      await admin.from("candidate_profiles").upsert({ user_id: userId, is_active_paid: true });
    } else if (target.role === "employer") {
      await admin.from("employer_profiles").upsert({ user_id: userId, is_premium: true });
    } else {
      return NextResponse.json({ error: "Activation réservée aux candidates/employeurs" }, { status: 400 });
    }
    await logAudit(me, "activate_subscription", { targetId: userId, targetName, details: { manual: true } });
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
