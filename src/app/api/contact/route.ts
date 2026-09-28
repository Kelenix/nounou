import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail, escapeHtml } from "@/features/email/mailer";

/**
 * Formulaire de contact public : envoie le message à la boîte de contact via
 * Resend. Échoue proprement (503) si l'e-mail n'est pas configuré — l'écran
 * invite alors à passer par WhatsApp / e-mail direct.
 */

// Boîte de réception des messages du formulaire.
const CONTACT_INBOX = process.env.CONTACT_INBOX?.trim() || "sagesseamouret@gmail.com";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(5).max(5000),
  // Honeypot anti-bot : champ caché qui doit rester vide.
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const { name, email, subject, message, website } = parsed.data;

  // Bot détecté (honeypot rempli) : on répond OK sans rien envoyer.
  if (website) return NextResponse.json({ ok: true });

  const html = `<!doctype html><html lang="fr"><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a">
    <h2 style="margin:0 0 12px">Nouveau message de contact</h2>
    <p style="margin:2px 0"><b>Nom :</b> ${escapeHtml(name)}</p>
    <p style="margin:2px 0"><b>E-mail :</b> ${escapeHtml(email)}</p>
    ${subject ? `<p style="margin:2px 0"><b>Sujet :</b> ${escapeHtml(subject)}</p>` : ""}
    <p style="margin:12px 0 4px"><b>Message :</b></p>
    <p style="margin:0;white-space:pre-wrap;color:#475569">${escapeHtml(message)}</p>
  </body></html>`;

  try {
    await sendEmail(CONTACT_INBOX, subject ? `Contact — ${subject}` : "Nouveau message de contact", html);
  } catch (e) {
    console.error("[contact] envoi échoué", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
