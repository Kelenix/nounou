import "server-only";

// Client SMS Pro Africa (https://app.smspro.africa) — envoi d'un SMS simple.
// Utilisé par le hook « Send SMS » de Supabase pour livrer les codes OTP.
const SEND_URL = "https://app.smspro.africa/api/v3/sms/send";

/**
 * Envoie un SMS via SMS Pro Africa.
 * @param recipient Numéro au format international SANS le « + » (ex. 2250700000000).
 * @param message   Contenu du SMS.
 */
export async function sendSms(recipient: string, message: string): Promise<void> {
  const token = process.env.SMSPRO_API_TOKEN;
  const senderId = process.env.SMSPRO_SENDER_ID;
  if (!token || !senderId) {
    throw new Error("SMS Pro Africa non configuré (SMSPRO_API_TOKEN / SMSPRO_SENDER_ID).");
  }

  const res = await fetch(SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      recipient,
      sender_id: senderId,
      type: "plain",
      message,
    }),
  });

  const data = (await res.json().catch(() => null)) as { status?: string; message?: string } | null;
  if (!res.ok || data?.status !== "success") {
    throw new Error(`Échec de l'envoi SMS (${res.status}) : ${data?.message ?? "réponse inattendue"}`);
  }
}
