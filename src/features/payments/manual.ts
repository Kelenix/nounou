/**
 * Paiement mobile money « relais local » : le client paie sur un compte Orange
 * Money / Wave contrôlé par l'exploitant, puis déclare la transaction dans l'app.
 * La validation est faite par un admin (aucune API ne permet de vérifier
 * automatiquement un compte mobile money personnel). Config par variables
 * NEXT_PUBLIC_ (les coordonnées de paiement sont montrées au client).
 *
 * Wave : on accepte un lien marchand de base (sans montant) et on y injecte le
 * montant courant (depuis les réglages) → un seul lien, toujours synchronisé
 * avec le prix. Ex. https://pay.wave.com/m/M_ci_xxx/c/ci/
 */

export type ManualMethod = "orange_money" | "wave";
/** `number` optionnel (Wave peut n'avoir qu'un lien marchand, sans numéro à afficher). */
export type ManualChannel = { moyen: ManualMethod; number?: string };

function waveMerchantLink(): string | undefined {
  return process.env.NEXT_PUBLIC_WAVE_MERCHANT_LINK?.trim() || undefined;
}

/** Canaux configurés proposés au client (numéro OM et/ou lien/numéro Wave). */
export function manualChannels(): ManualChannel[] {
  const channels: ManualChannel[] = [];
  const om = process.env.NEXT_PUBLIC_MANUAL_PAY_OM?.trim();
  const waveNumber = process.env.NEXT_PUBLIC_MANUAL_PAY_WAVE?.trim();
  if (om) channels.push({ moyen: "orange_money", number: om });
  if (waveNumber || waveMerchantLink()) channels.push({ moyen: "wave", number: waveNumber || undefined });
  return channels;
}

/** Nom du titulaire du compte (à afficher pour que le client vérifie le destinataire). */
export function manualPayeeName(): string {
  return process.env.NEXT_PUBLIC_MANUAL_PAY_NAME?.trim() || "";
}

/** Lien de paiement Wave prérempli avec le montant courant (FCFA), ou `undefined`. */
export function waveLinkForAmount(montant: number): string | undefined {
  const base = waveMerchantLink();
  if (!base) return undefined;
  try {
    const url = new URL(base);
    url.searchParams.set("amount", String(montant));
    return url.toString();
  } catch {
    return undefined;
  }
}
