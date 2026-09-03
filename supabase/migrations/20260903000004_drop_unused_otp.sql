-- ============================================================================
-- Sécurité/dette — S9 : suppression de la table `otp_codes` inutilisée.
-- L'authentification OTP passe par le schéma `auth` natif de Supabase ; cette
-- table applicative n'est référencée nulle part dans le code.
-- ============================================================================

drop table if exists public.otp_codes cascade;
