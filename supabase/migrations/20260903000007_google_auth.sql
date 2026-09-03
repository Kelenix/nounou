-- ============================================================================
-- Authentification Google (OAuth) — le compte est créé sans téléphone (Google
-- ne le fournit pas). Le téléphone reste demandé, mais à l'onboarding.
--   1) `profiles.phone` devient NULLABLE (reste UNIQUE : plusieurs NULL permis).
--   2) `handle_new_user` insère un téléphone NULL si absent + préremplit
--      nom/prénom/photo depuis les métadonnées Google si présentes.
--   3) Le garde S1 autorise la PREMIÈRE saisie du téléphone (onboarding), mais
--      pas sa modification ensuite par un utilisateur standard.
-- ============================================================================

alter table public.profiles alter column phone drop not null;

-- --- Création de profil à l'inscription (téléphone nullable + préremplissage) ---
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone, phone_verified, prenom, nom, photo_url)
  values (
    new.id,
    nullif(coalesce(new.phone, new.raw_user_meta_data->>'phone', ''), ''),
    new.phone_confirmed_at is not null,
    new.raw_user_meta_data->>'given_name',
    new.raw_user_meta_data->>'family_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- --- Garde S1 mis à jour : autoriser la première saisie du téléphone ---
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
  or new.phone_verified     is distinct from old.phone_verified then
    raise exception 'Modification de champs protégés interdite';
  end if;

  -- Téléphone : renseignable UNE fois (onboarding), non modifiable ensuite.
  if new.phone is distinct from old.phone and coalesce(old.phone, '') <> '' then
    raise exception 'Modification du téléphone interdite';
  end if;

  return new;
end;
$$;
