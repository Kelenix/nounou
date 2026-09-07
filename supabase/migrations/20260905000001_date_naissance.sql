-- ============================================================================
-- Date de naissance (Phase B).
--   - Colonne `date_naissance` facultative (comptes existants sans date).
--   - La vue publique `public_profiles` expose l'ÂGE CALCULÉ uniquement — la
--     date de naissance brute n'est jamais exposée publiquement (vie privée).
-- ============================================================================
alter table public.profiles add column if not exists date_naissance date;

create or replace view public.public_profiles as
  select id, role, nom, prenom, photo_url, ville, commune,
         verification_level, is_active, is_suspended, created_at,
         case
           when date_naissance is not null
           then extract(year from age(date_naissance))::int
         end as age
  from public.profiles;

grant select on public.public_profiles to anon, authenticated;
