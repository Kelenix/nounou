import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin";
import { toE164Ci } from "@/lib/utils";

const bodySchema = z.object({
  prenom: z.string().trim().min(2).max(60),
  nom: z.string().trim().min(2).max(60),
  phone: z.string().trim(),
});

export async function POST(request: Request) {
  const me = await getCurrentProfile();
  // Seul le Super Admin peut créer des administrateurs.
  if (!me || me.role !== "admin" || !me.is_super_admin) {
    return NextResponse.json({ error: "Réservé au Super Admin" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });
  }
  const { prenom, nom } = parsed.data;
  const e164 = toE164Ci(parsed.data.phone); // +225XXXXXXXXXX
  if (!e164) {
    return NextResponse.json({ error: "Numéro invalide (10 chiffres)" }, { status: 400 });
  }
  const stored = e164.replace(/^\+/, ""); // GoTrue stocke sans le « + »

  const admin = createAdminClient();

  // Déjà un compte avec ce numéro ? → on le promeut administrateur.
  const { data: existing } = await admin.from("profiles").select("id").eq("phone", stored).maybeSingle();
  if (existing) {
    await admin.from("profiles").update({ role: "admin", prenom, nom, verification_level: "verified" }).eq("id", existing.id);
    await logAudit(me, "create_admin", { targetId: existing.id, targetName: `${prenom} ${nom}`, details: { promoted: true } });
    return NextResponse.json({ ok: true, promoted: true });
  }

  // Sinon, on crée le compte auth (le trigger crée le profil), puis on le passe admin.
  const { data: created, error } = await admin.auth.admin.createUser({
    phone: e164,
    phone_confirm: true,
  });
  if (error || !created?.user) {
    return NextResponse.json({ error: "Création impossible (numéro déjà utilisé ?)" }, { status: 500 });
  }
  await admin
    .from("profiles")
    .update({ role: "admin", prenom, nom, verification_level: "verified" })
    .eq("id", created.user.id);
  await logAudit(me, "create_admin", { targetId: created.user.id, targetName: `${prenom} ${nom}`, details: { created: true } });

  return NextResponse.json({ ok: true, created: true });
}
