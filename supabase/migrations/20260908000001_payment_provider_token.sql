-- Jeton d'invoice renvoyé par le fournisseur à l'initiation (ex. token PayDunya).
-- Permet de réconcilier une transaction en interrogeant le fournisseur a posteriori,
-- même sans webhook (cf. reconcilePayment / cron). CinetPay n'en a pas besoin
-- (réconciliation via reference_transaction).
alter table public.payments add column if not exists provider_token text;
