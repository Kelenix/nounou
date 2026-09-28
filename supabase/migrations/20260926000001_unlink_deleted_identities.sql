-- ============================================================================
-- Compte supprimé : délier ses identités de connexion (Google, e-mail…).
--
-- L'anonymisation change l'e-mail du compte auth, mais la ligne auth.identities
-- (provider = google, provider_id = identifiant Google) restait rattachée au
-- compte BANNI. Un « Continuer avec Google » avec le même compte Google
-- retombait donc sur ce compte banni → échec OAuth, réinscription impossible.
-- Supprimer ces identités libère le compte Google (et efface des données perso).
-- ============================================================================

create or replace function public.unlink_auth_identities(p_user_id uuid)
returns void
language sql security definer set search_path = '' as $$
  delete from auth.identities where user_id = p_user_id;
$$;

revoke all on function public.unlink_auth_identities(uuid) from public, anon, authenticated;
grant execute on function public.unlink_auth_identities(uuid) to service_role;

-- Rattrapage : comptes déjà supprimés/anonymisés avant ce correctif.
delete from auth.identities i
using public.profiles p
where p.id = i.user_id
  and p.deleted_at is not null;
