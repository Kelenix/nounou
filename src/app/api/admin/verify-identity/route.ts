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
    await logAudit(me, "verify_identity", { targetId: userId, details: { approved: true } });
    return NextResponse.json({ ok: true, approved: true });
  }

  // Rejet : on retire le document (l'utilisateur pourra en re-téléverser un).
  const { error } = await admin.from("profiles").update({ identity_doc_path: null }).eq("id", userId);
  if (error) return NextResponse.json({ error: "Rejet impossible" }, { status: 500 });
  await logAudit(me, "verify_identity", { targetId: userId, details: { rejected: true } });
  return NextResponse.json({ ok: true, rejected: true });
}
