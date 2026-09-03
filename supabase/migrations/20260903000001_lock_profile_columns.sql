-- ============================================================================
-- Sécurité — S1 : empêche l'élévation de privilège via mise à jour de son
-- propre profil.
--
-- La politique RLS `profiles_update_own_or_admin` autorise un utilisateur à
-- modifier sa propre ligne, mais SANS restriction de colonne : un compte
-- connecté pouvait donc se passer `role = 'admin'` (→ is_admin() = true → accès
-- à tous les téléphones/paiements/messages) ou se donner un faux badge de
-- vérification. Ce trigger verrouille les colonnes sensibles pour les
-- utilisateurs standard.
--
-- Chemins de confiance préservés :
--   • service_role / opérations serveur  => auth.uid() IS NULL  => autorisé ;
--   • un admin DÉJÀ enregistré en base    => autorisé ;
--   • inscription/onboarding              => rôle initial candidate/employeur OK ;
--   • édition de profil                   => nom/prénom/photo/ville/commune OK.
-- ============================================================================

create or replace function public.profiles_guard_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_admin boolean;
begin
  -- Contexte serveur / service_role (pas de JWT) => chemin de confiance.
  if auth.uid() is null then
    return new;
  end if;

  -- Un admin DÉJÀ enregistré en base est de confiance pour les champs élevés.
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
    into caller_is_admin;
  if caller_is_admin then
    return new;
  end if;

  -- Utilisateur standard modifiant sa propre ligne : on verrouille.
  if new.role is distinct from old.role and new.role = 'admin'::public.user_role then
    raise exception 'Élévation de privilège interdite';
  end if;

  if new.is_super_admin     is distinct from old.is_super_admin
  or new.staff_permissions  is distinct from old.staff_permissions
  or new.verification_level is distinct from old.verification_level
  or new.is_suspended       is distinct from old.is_suspended
  or new.phone_verified     is distinct from old.phone_verified
  or new.phone              is distinct from old.phone then
    raise exception 'Modification de champs protégés interdite';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_guard_self_update on public.profiles;
create trigger trg_profiles_guard_self_update
  before update on public.profiles
  for each row execute function public.profiles_guard_self_update();
