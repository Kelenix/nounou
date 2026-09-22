import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { anonymizeAccount } from "@/features/account/purge";

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
  // Suppression (RGPD) : le compte est banni, masqué, et son identité est
  // ANONYMISÉE immédiatement — nom/téléphone/e-mail effacés — afin que l'e-mail
  // et le numéro puissent resservir à une nouvelle inscription. La ligne et les
  // paiements liés sont CONSERVÉS (statistiques). Opération définitive.
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
  // Libère l'e-mail + le téléphone (anonymisation), après avoir posé deleted_at.
  await anonymizeAccount(admin, user.id);
  // Ferme la session courante de l'utilisateur.
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
