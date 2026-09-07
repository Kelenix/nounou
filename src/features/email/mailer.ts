import "server-only";

/**
 * Envoi d'email transactionnel via Resend (https://resend.com).
 * Inactif si `RESEND_API_KEY` / `EMAIL_FROM` ne sont pas configurés.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.warn("[email] non configuré (RESEND_API_KEY / EMAIL_FROM) — email ignoré.");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Gabarit d'email de notification (simple, responsive, aux couleurs de la marque). */
export function notificationEmailHtml(titre: string, message: string, appUrl: string): string {
  const t = escapeHtml(titre);
  const m = escapeHtml(message);
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="background:#ffffff;border-radius:16px;padding:28px">
      <h1 style="margin:0 0 8px;font-size:18px;color:#0f172a">${t}</h1>
      <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.5">${m}</p>
      <a href="${appUrl}/app" style="display:inline-block;background:#2E9E1F;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:700">Ouvrir J'ai ma nounou</a>
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px">J'ai ma nounou · <a href="${appUrl}" style="color:#94a3b8">${escapeHtml(appUrl)}</a></p>
  </div></body></html>`;
}
