import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formate un montant en FCFA (XOF), ex. 1000 → « 1 000 FCFA ».
 *  Les espaces fines insécables produites par Intl sont normalisées en espace standard. */
export function formatFcfa(montant: number): string {
  const n = new Intl.NumberFormat("fr-FR")
    .format(montant)
    .replace(/\s/g, " ");
  return `${n} FCFA`;
}

/**
 * Normalise un numéro CI en E.164 (+225 suivi de 10 chiffres, 0 initial conservé).
 * Ex. « 07 00 00 00 01 » → « +2250700000001 ».
 */
export function toE164Ci(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("225") ? digits.slice(3) : digits;
  if (local.length !== 10) return null;
  return `+225${local}`;
}

/** Affiche joliment un numéro CI : +225 07 00 00 00 01.
 *  Accepte le format avec ou sans « + » (GoTrue stocke sans le « + »). */
export function formatPhoneCi(phone: string): string {
  const local = phone.replace(/^\+?225/, "");
  return `+225 ${local.replace(/(\d{2})(?=\d)/g, "$1 ").trim()}`;
}
