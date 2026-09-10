import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/** Suppression, par l'utilisateur lui-même, de son propre compte (RGPD). */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Le Super Admin ne peut pas supprimer son propre compte (anchor de la plateforme).
  const { data: me } = await supabase.from("profiles").select("is_super_admin").eq("id", user.id).maybeSingle();
  if (me?.is_super_admin) {
    return NextResponse.json({ error: "Le compte Super Admin ne peut pas être supprimé" }, { status: 403 });
  }

  const admin = createAdminClient();
  // Suppression DOUCE (RGPD) : le compte est banni et masqué immédiatement, mais
  // conservé (données financières/modération) le temps de la durée de conservation,
  // puis anonymisé automatiquement par le cron de purge. Base légale : obligations
  // comptables et prévention de la fraude/litiges.
  await admin
    .from("profiles")
    .update({
      deleted_at: new Date().toISOString(),
      deletion_reason: "Auto-suppression (RGPD)",
      is_suspended: true,
    })
    .eq("id", user.id);
  const { error } = await admin.auth.admin.updateUserById(user.id, { ban_duration: "876000h" });
  if (error) {
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
  // Ferme la session courante de l'utilisateur.
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
