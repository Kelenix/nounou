/**
 * Paiement mobile money « relais local » : le client paie sur un compte Orange
 * Money / Wave contrôlé par l'exploitant, puis déclare la transaction dans l'app.
 * La validation est faite par un admin (aucune API ne permet de vérifier
 * automatiquement un compte mobile money personnel). Config par variables
 * NEXT_PUBLIC_ (les coordonnées de paiement sont montrées au client).
 */

export type ManualMethod = "orange_money" | "wave";
export type ManualChannel = { moyen: ManualMethod; number: string };

/** Canaux configurés (numéro renseigné) proposés au client. */
export function manualChannels(): ManualChannel[] {
  const channels: ManualChannel[] = [];
  const om = process.env.NEXT_PUBLIC_MANUAL_PAY_OM?.trim();
  const wave = process.env.NEXT_PUBLIC_MANUAL_PAY_WAVE?.trim();
  if (om) channels.push({ moyen: "orange_money", number: om });
  if (wave) channels.push({ moyen: "wave", number: wave });
  return channels;
}

/** Nom du titulaire du compte (à afficher pour que le client vérifie le destinataire). */
export function manualPayeeName(): string {
  return process.env.NEXT_PUBLIC_MANUAL_PAY_NAME?.trim() || "";
}
