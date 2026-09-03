-- ============================================================================
-- Ajoute le moyen de paiement « carte » (Stripe) à l'enum public.payment_method.
-- Permet de router les paiements par carte vers Stripe, distinct du Mobile Money.
-- NB : `ALTER TYPE ... ADD VALUE` ne peut pas s'exécuter dans le même bloc
-- transactionnel qui utilise ensuite la valeur ; ici la migration ne fait que
-- l'ajout, donc c'est sans risque.
-- ============================================================================
alter type public.payment_method add value if not exists 'carte';
