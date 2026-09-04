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

  // Validation email (si fourni).
  if (email && !z.string().email().safeParse(email).success) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  // Validation téléphone (si fourni). `e164` = +225… ; `storedPhone` = sans le « + ».
  let e164: string | null = null;
  let storedPhone: string | null = null;
  if (parsed.data.phone) {
    e164 = toE164Ci(parsed.data.phone);
    if (!e164) {
      return NextResponse.json({ error: "Numéro invalide (10 chiffres)" }, { status: 400 });
    }
    storedPhone = e164.replace(/^\+/, ""); // GoTrue stocke sans le « + »
  }

  const admin = createAdminClient();
  // Le téléphone est écrit explicitement pour qu'il apparaisse même via la voie email.
  const adminFields = {
    role: "admin" as const,
    prenom,
    nom,
    verification_level: "verified" as const,
    ...(storedPhone ? { phone: storedPhone } : {}),
  };

  // --- Compte déjà existant ? On le retrouve par email (Google) puis par téléphone. ---
  let targetId: string | null = null;
  if (email) {
    const { data } = await admin.rpc("admin_user_id_by_email", { p_email: email });
    targetId = data ?? null;
  }
  if (!targetId && storedPhone) {
    const { data } = await admin.from("profiles").select("id").eq("phone", storedPhone).maybeSingle();
    targetId = data?.id ?? null;
  }

  if (targetId) {
    const { error } = await admin.from("profiles").update(adminFields).eq("id", targetId);
    if (error) {
      const msg = error.code === "23505" ? "Ce numéro est déjà utilisé par un autre compte." : "Promotion impossible.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    await logAudit(me, "create_admin", { targetId, targetName: `${prenom} ${nom}`, details: { promoted: true } });
    return NextResponse.json({ ok: true, promoted: true });
  }

  // --- Sinon on crée le compte (email confirmé et/ou téléphone confirmé). ---
  const { data: created, error } = await admin.auth.admin.createUser({
    ...(email ? { email, email_confirm: true } : {}),
    ...(e164 ? { phone: e164, phone_confirm: true } : {}),
  });
  if (error || !created?.user) {
    return NextResponse.json({ error: "Création impossible (email ou numéro déjà utilisé ?)" }, { status: 500 });
  }
  await admin.from("profiles").update(adminFields).eq("id", created.user.id);
  await logAudit(me, "create_admin", { targetId: created.user.id, targetName: `${prenom} ${nom}`, details: { created: true } });

  return NextResponse.json({ ok: true, created: true });
}
