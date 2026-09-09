-- ============================================================================
-- Relances e-mail automatiques (onboarding).
--   Deux séquences espacées et PLAFONNÉES (J+0, J+1, J+3, J+7 → 4 envois max) :
--     • 'complete_profile'   : inscription commencée mais profil non terminé.
--     • 'activate_candidate' : candidat dont l'activation (paiement) n'est pas faite.
--   `email_reminders` garantit l'idempotence (jamais 2× le même palier).
--   `profiles.email_opt_out` : désinscription (lien en pied de chaque e-mail).
-- ============================================================================

alter table public.profiles
  add column if not exists email_opt_out boolean not null default false;

create table if not exists public.email_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,             -- 'complete_profile' | 'activate_candidate'
  step smallint not null,         -- palier de la séquence : 0, 1, 3 ou 7 (jours)
  sent_at timestamptz not null default now(),
  unique (user_id, kind, step)    -- idempotence : un palier n'est envoyé qu'une fois
);
create index if not exists email_reminders_user_idx on public.email_reminders (user_id, kind);

-- RLS obligatoire. Table purement interne (cron / service_role) : AUCUNE policy,
-- donc inaccessible aux rôles anon/authenticated ; seul service_role la lit/écrit
-- (il contourne la RLS par conception).
alter table public.email_reminders enable row level security;
