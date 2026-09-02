import "server-only";

import type { PaymentMethod, PaymentStatus, PaymentType } from "@/lib/supabase/database.types";

export type InitiatePaymentInput = {
  userId: string;
  montant: number;
  moyen: PaymentMethod;
  type: PaymentType;
  phone: string;
};

export type InitiatePaymentResult = {
  reference: string;
  status: PaymentStatus;
};

/**
 * Interface d'un agrégateur de paiement Mobile Money.
 * Isole la logique pour brancher plus tard CinetPay / PayDunya / Djamo… (cf. ADR-002)
 * sans toucher au reste du code.
 */
export interface PaymentProvider {
  readonly name: string;
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
}

/**
 * Implémentation de développement : simule un paiement immédiatement réussi.
 * En production, remplacer par un vrai provider (initiation + webhook de confirmation).
 */
class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const reference = `MOCK-${input.type}-${input.userId.slice(0, 8)}-${input.montant}`;
    // En dev, on considère le paiement réussi (callback simulé).
    console.info(`[paiement mock] ${input.moyen} — ${input.montant} FCFA — ${input.phone} → réussi`);
    return { reference, status: "reussi" };
  }
}

/** Sélectionne le provider selon l'environnement (mock en dev). */
export function getPaymentProvider(): PaymentProvider {
  // Ici, brancher le vrai provider quand les clés seront disponibles.
  return new MockPaymentProvider();
}
