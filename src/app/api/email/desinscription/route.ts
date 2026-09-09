import { createAdminClient } from "@/lib/supabase/server";
import { verifyUnsubToken } from "@/features/email/relances";

export const dynamic = "force-dynamic";

/** Petite page HTML de confirmation (aux couleurs de la marque), sans dépendance. */
function page(title: string, message: string): Response {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://jaimanounou.com";
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
  <body style="margin:0;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:480px;margin:0 auto;padding:48px 24px;text-align:center">
      <div style="background:#fff;border-radius:16px;padding:32px">
        <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a">${title}</h1>
        <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.5">${message}</p>
        <a href="${appUrl}" style="display:inline-block;background:#2E9E1F;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:700">Retour au site</a>
      </div>
    </div>
  </body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

/**
 * Désinscription des rappels e-mail (lien en pied de chaque relance).
 * `?u=<user_id>&t=<jeton HMAC>` — le jeton évite qu'on désinscrive un tiers.
 * Positionne `profiles.email_opt_out = true` (les segments de relance l'excluent ensuite).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("u") ?? "";
  const token = url.searchParams.get("t") ?? "";

  if (!userId || !token || !verifyUnsubToken(userId, token)) {
    return page("Lien invalide", "Ce lien de désinscription n'est pas valide ou a expiré.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ email_opt_out: true }).eq("id", userId);
  if (error) {
    return page("Une erreur est survenue", "Merci de réessayer dans quelques instants.");
  }

  return page(
    "Vous êtes désinscrit(e)",
    "Vous ne recevrez plus de rappels d'inscription. Les e-mails liés à votre activité (messages, paiements) continuent de vous être envoyés.",
  );
}
