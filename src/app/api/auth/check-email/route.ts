import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Indique si un compte existe déjà pour un e-mail donné (avant inscription).
 * Permet d'afficher un message clair « e-mail déjà utilisé » au lieu d'envoyer
 * un code qui connecterait au compte existant. Un compte supprimé a son e-mail
 * anonymisé → il n'est PAS trouvé ici, donc l'adresse redevient inscriptible.
 */
const bodySchema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data: userId } = await admin.rpc("admin_user_id_by_email", { p_email: parsed.data.email });
  return NextResponse.json({ exists: !!userId });
}
