import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { sendSms } from "@/features/sms/smspro";

// Node.js runtime requis (utilise `node:crypto`).
export const runtime = "nodejs";

/**
 * Hook « Send SMS » de Supabase Auth.
 * Supabase génère le code OTP puis appelle cet endpoint (signé selon la spec
 * Standard Webhooks). On vérifie la signature, puis on envoie le SMS via
 * SMS Pro Africa. Configurez l'URL et le secret dans :
 *   Supabase → Authentication → Hooks → Send SMS.
 */

const TOLERANCE_SECONDS = 5 * 60; // anti-rejeu

/** Vérifie la signature Standard Webhooks (HMAC-SHA256). */
function verifySignature(secret: string, id: string, timestamp: string, body: string, sigHeader: string): boolean {
  const base64Secret = secret.replace(/^v1,whsec_/, "").replace(/^whsec_/, "");
  const key = Buffer.from(base64Secret, "base64");
  const expected = crypto.createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
  const expectedBuf = Buffer.from(expected);
  // L'en-tête peut contenir plusieurs signatures séparées par un espace : « v1,<sig> v1,<sig> ».
  return sigHeader.split(" ").some((part) => {
    const sig = part.split(",")[1];
    if (!sig) return false;
    const sigBuf = Buffer.from(sig);
    return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
  });
}

export async function POST(request: Request) {
  const secret = process.env.SEND_SMS_HOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Hook SMS non configuré" }, { status: 500 });
  }

  const body = await request.text();
  const id = request.headers.get("webhook-id") ?? "";
  const timestamp = request.headers.get("webhook-timestamp") ?? "";
  const signature = request.headers.get("webhook-signature") ?? "";

  // Fenêtre temporelle (anti-rejeu).
  const ts = Number(timestamp);
  if (!ts || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) {
    return NextResponse.json({ error: "Horodatage invalide" }, { status: 401 });
  }
  if (!verifySignature(secret, id, timestamp, body, signature)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let payload: { user?: { phone?: string }; sms?: { otp?: string } };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const phone = payload.user?.phone;
  const otp = payload.sms?.otp;
  if (!phone || !otp) {
    return NextResponse.json({ error: "Numéro ou code manquant" }, { status: 400 });
  }

  const recipient = phone.replace(/^\+/, ""); // SMS Pro Africa attend le numéro sans « + »
  const message = `Votre code de connexion J'ai ma nounou : ${otp}`;

  try {
    await sendSms(recipient, message);
  } catch (e) {
    return NextResponse.json(
      { error: { http_code: 500, message: (e as Error).message } },
      { status: 500 },
    );
  }

  return NextResponse.json({});
}
