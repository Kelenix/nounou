import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth";
import { canAccess } from "@/lib/admin-permissions";
import { createAdminClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin";

const bodySchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

export async function POST(request: Request) {
  const me = await getCurrentProfile();
  // Réservé aux admins ayant la section « Utilisateurs ».
  if (!me || me.role !== "admin" || !canAccess(me, "users")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { userId, action } = parsed.data;
  const admin = createAdminClient();

  if (action === "approve") {
    // Le garde S1 interdit à l'utilisateur de se vérifier lui-même ; ici c'est
    // le service_role (contexte de confiance) qui valide.
    const { error } = await admin.from("profiles").update({ verification_level: "identity" }).eq("id", userId);
    if (error) return NextResponse.json({ error: "Validation impossible" }, { status: 500 });
    await admin.from("notifications").insert({
      user_id: userId,
      type: "profil_verifie",
      titre: "Profil vérifié",
      message: "Votre pièce d'identité a été validée : votre profil est désormais vérifié.",
    });
    await logAudit(me, "verify_identity", { targetId: userId, details: { approved: true } });
    return NextResponse.json({ ok: true, approved: true });
  }

  // Rejet : on retire le document (l'utilisateur pourra en re-téléverser un).
  const { error } = await admin.from("profiles").update({ identity_doc_path: null }).eq("id", userId);
  if (error) return NextResponse.json({ error: "Rejet impossible" }, { status: 500 });
  await admin.from("notifications").insert({
    user_id: userId,
    type: "systeme",
    titre: "Pièce d'identité non validée",
    message: "Votre pièce d'identité n'a pas pu être validée. Merci d'en soumettre une nouvelle, lisible et en cours de validité.",
  });
  await logAudit(me, "verify_identity", { targetId: userId, details: { rejected: true } });
  return NextResponse.json({ ok: true, rejected: true });
}
