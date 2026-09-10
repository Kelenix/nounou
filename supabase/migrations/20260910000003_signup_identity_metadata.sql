-- ============================================================================
-- Identité renseignée DÈS la création du compte (atomique, côté serveur).
--
-- Avant : à l'inscription e-mail, seul le téléphone arrivait dans les
-- métadonnées ; nom/prénom/rôle/date de naissance étaient écrits par un second
-- `UPDATE` côté client APRÈS la création du compte. Si cet UPDATE était
-- interrompu (onglet fermé, coupure réseau…), on obtenait un compte confirmé
-- mais sans nom ni rôle. Bug reproduit en production.
--
-- Après : le client passe toute l'identité dans `options.data` de
-- `signInWithOtp`, et ce trigger la persiste directement à l'INSERT. L'UPDATE
-- client ne sert plus que de filet idempotent.
--
-- On accepte les clés Google (given_name/family_name/avatar_url) ET les clés du
-- flux e-mail (identiques ici). Le rôle n'est appliqué que s'il est valide.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_role text := new.raw_user_meta_data->>'role';
  v_dob  text := new.raw_user_meta_data->>'date_naissance';
begin
  insert into public.profiles (
    id, phone, phone_verified, prenom, nom, photo_url, role, date_naissance
  )
  values (
    new.id,
    nullif(coalesce(new.phone, new.raw_user_meta_data->>'phone', ''), ''),
    new.phone_confirmed_at is not null,
    new.raw_user_meta_data->>'given_name',
    new.raw_user_meta_data->>'family_name',
    new.raw_user_meta_data->>'avatar_url',
    case when v_role in ('candidate', 'employer')
         then v_role::public.user_role end,
    case when v_dob ~ '^\d{4}-\d{2}-\d{2}$'
         then v_dob::date end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
