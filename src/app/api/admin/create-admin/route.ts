import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin";
import { toE164Ci } from "@/lib/utils";

const bodySchema = z
  .object({
    prenom: z.string().trim().min(2).max(60),
    nom: z.string().trim().min(2).max(60),
    phone: z.string().trim().default(""),
    email: z.string().trim().default(""),
  })
  // Au moins un moyen de connexion : email (Google) ou téléphone (OTP).
  .refine((d) => d.phone.length > 0 || d.email.length > 0, {
    message: "Renseignez un email ou un numéro.",
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
  const email = parsed.data.email.toLowerCase();
  const phone = parsed.data.phone;

  const admin = createAdminClient();
  const adminFields = { role: "admin" as const, prenom, nom, verification_level: "verified" as const };

  // ---------- Voie EMAIL : l'admin se connectera avec Google (même email) ----------
  if (email) {
    if (!z.string().email().safeParse(email).success) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    // Un compte existe déjà avec cet email ? → on le promeut administrateur.
    const { data: existingId } = await admin.rpc("admin_user_id_by_email", { p_email: email });
    if (existingId) {
      await admin.from("profiles").update(adminFields).eq("id", existingId);
      await logAudit(me, "create_admin", { targetId: existingId, targetName: `${prenom} ${nom}`, details: { promoted: true, via: "email" } });
      return NextResponse.json({ ok: true, promoted: true });
    }

    // Sinon on pré-crée le compte (email confirmé) : à sa 1ʳᵉ connexion Google
    // avec ce même email, Supabase relie l'identité et il arrive déjà admin.
    const { data: created, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (error || !created?.user) {
      return NextResponse.json({ error: "Création impossible (email déjà utilisé ?)" }, { status: 500 });
    }
    await admin.from("profiles").update(adminFields).eq("id", created.user.id);
    await logAudit(me, "create_admin", { targetId: created.user.id, targetName: `${prenom} ${nom}`, details: { created: true, via: "email" } });
    return NextResponse.json({ ok: true, created: true });
  }

  // ---------- Voie TÉLÉPHONE : connexion par OTP SMS ----------
  const e164 = toE164Ci(phone); // +225XXXXXXXXXX
  if (!e164) {
    return NextResponse.json({ error: "Numéro invalide (10 chiffres)" }, { status: 400 });
  }
  const stored = e164.replace(/^\+/, ""); // GoTrue stocke sans le « + »

  const { data: existing } = await admin.from("profiles").select("id").eq("phone", stored).maybeSingle();
  if (existing) {
    await admin.from("profiles").update(adminFields).eq("id", existing.id);
    await logAudit(me, "create_admin", { targetId: existing.id, targetName: `${prenom} ${nom}`, details: { promoted: true, via: "phone" } });
    return NextResponse.json({ ok: true, promoted: true });
  }

  const { data: created, error } = await admin.auth.admin.createUser({ phone: e164, phone_confirm: true });
  if (error || !created?.user) {
    return NextResponse.json({ error: "Création impossible (numéro déjà utilisé ?)" }, { status: 500 });
  }
  await admin.from("profiles").update(adminFields).eq("id", created.user.id);
  await logAudit(me, "create_admin", { targetId: created.user.id, targetName: `${prenom} ${nom}`, details: { created: true, via: "phone" } });

  return NextResponse.json({ ok: true, created: true });
}
