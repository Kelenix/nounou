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
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
