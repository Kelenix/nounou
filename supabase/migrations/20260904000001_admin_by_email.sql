-- ============================================================================
-- Création d'un administrateur par EMAIL (compte Google).
-- Le Super Admin saisit l'email d'un compte Google : la personne devient
-- administrateur en se connectant avec Google (même email).
-- Cette fonction retrouve l'id d'authentification d'un email donné, afin de
-- promouvoir un compte déjà existant. Réservée au `service_role` (serveur).
-- ============================================================================
create or replace function public.admin_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

-- Verrouillage : seul le contexte serveur (service_role) peut l'appeler.
revoke all on function public.admin_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.admin_user_id_by_email(text) to service_role;
