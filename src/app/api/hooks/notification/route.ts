import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail, notificationEmailHtml } from "@/features/email/mailer";

export const runtime = "nodejs";

/**
 * Webhook Supabase (Database → Webhooks) sur INSERT dans `public.notifications`.
 * Envoie un email au destinataire pour chaque nouvelle notification (message,
 * candidature, paiement…). À configurer côté Supabase avec l'en-tête secret
 * `x-webhook-secret` = NOTIFICATION_HOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.NOTIFICATION_HOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Hook non configuré" }, { status: 500 });
  }
  if (request.headers.get("x-webhook-secret") !== secret) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const record = payload?.record;
  // On ne traite que les insertions de notifications.
  if (payload?.type !== "INSERT" || !record?.user_id) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(record.user_id);
  const email = data?.user?.email;
  // Compte sans email (téléphone/Google sans email) : rien à envoyer.
  if (!email) {
    return NextResponse.json({ received: true, noEmail: true });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://jaimanounou.com";
  const titre = record.titre ?? "Nouvelle notification";
  const html = notificationEmailHtml(titre, record.message ?? "", appUrl);

  try {
    await sendEmail(email, `${titre} · J'ai ma nounou`, html);
  } catch (e) {
    console.error("[hook notification] envoi email échoué:", e);
    // On renvoie 200 pour ne pas faire échouer/rejouer le webhook en boucle.
    return NextResponse.json({ received: true, emailError: true });
  }

  return NextResponse.json({ received: true, sent: true });
}
