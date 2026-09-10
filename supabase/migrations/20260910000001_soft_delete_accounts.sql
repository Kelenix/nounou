-- ============================================================================
-- Suppression « douce » (soft-delete) des comptes.
--
-- Objectif : conserver l'historique financier (paiements), les avis (ratings),
-- les signalements (reports) et la TRAÇABILITÉ d'un compte même après sa
-- suppression ou son bannissement — pour l'évaluation de la plateforme et
-- d'éventuels litiges futurs. Le compte reste en base (donc AUCUNE cascade ne se
-- déclenche), mais il est banni côté auth (plus de connexion) et masqué partout.
--
-- Rétention : après un délai (cf. ACCOUNT_RETENTION_MONTHS côté app), un cron
-- ANONYMISE le compte (efface les données personnelles) tout en gardant les
-- enregistrements financiers/modération liés. `anonymized_at` marque cette étape.
--
-- Idempotente (IF NOT EXISTS / OR REPLACE).
-- ============================================================================

alter table public.profiles
  add column if not exists deleted_at      timestamptz,
  add column if not exists deleted_by      uuid references public.profiles(id) on delete set null,
  add column if not exists deletion_reason text,
  add column if not exists anonymized_at   timestamptz;

create index if not exists profiles_deleted_idx on public.profiles (deleted_at);

-- La vue publique masque les comptes supprimés : défense au niveau source, tous
-- les listings marketplace (recherche, catalogue, fiches, candidatures) en
-- héritent automatiquement, sans dépendre d'un filtre applicatif oublié.
-- (Redéfinition à l'identique de 20260905000001 + clause `where deleted_at is null`.)
create or replace view public.public_profiles as
  select id, role, nom, prenom, photo_url, ville, commune,
         verification_level, is_active, is_suspended, created_at,
         case
           when date_naissance is not null
           then extract(year from age(date_naissance))::int
         end as age
  from public.profiles
  where deleted_at is null;
grant select on public.public_profiles to anon, authenticated;
