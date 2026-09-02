-- ============================================================================
-- « J'ai ma nounou » — Schéma initial (MVP)
-- Postgres / Supabase. RLS activée sur TOUTES les tables (exigence sécurité).
-- Note : la table « users » de l'INTAKE est nommée `public.profiles` et liée à
-- `auth.users(id)` (convention Supabase ; cf. DECISION_LOG).
-- ============================================================================

-- ---------- Types énumérés -------------------------------------------------
create type public.user_role as enum ('candidate', 'employer', 'admin');
create type public.verification_level as enum ('phone', 'identity', 'verified');
create type public.service_type as enum (
  'menage', 'cuisine', 'garde_enfants', 'lessive', 'repassage',
  'entretien', 'assistance_personnes_agees', 'autre'
);
create type public.offer_status as enum ('active', 'close');
create type public.application_status as enum (
  'en_attente', 'consultee', 'acceptee', 'refusee', 'annulee'
);
create type public.report_motif as enum (
  'fausse_identite', 'arnaque', 'harcelement', 'offre_frauduleuse',
  'comportement', 'conditions_differentes', 'autre'
);
create type public.report_status as enum ('ouvert', 'en_cours', 'traite', 'rejete');
create type public.payment_method as enum ('orange_money', 'mtn_momo', 'moov_money', 'wave');
create type public.payment_status as enum ('en_attente', 'reussi', 'echoue', 'annule');
create type public.payment_type as enum ('activation_candidate', 'premium_employeur');
create type public.rating_context as enum ('employer_rates_candidate', 'candidate_rates_employer');
create type public.notification_type as enum (
  'nouvelle_candidature', 'candidature_acceptee', 'candidature_refusee',
  'paiement_confirme', 'profil_verifie', 'signalement', 'nouveau_message', 'systeme'
);

-- ---------- Fonctions utilitaires ------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- (Les fonctions app_current_role() / is_admin() sont définies APRÈS la table
--  `profiles` car elles la référencent — une fonction SQL est validée à sa création.)

-- ---------- profiles (≈ users de l'INTAKE) ---------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique not null,
  phone_verified boolean not null default false,
  role public.user_role,
  nom text,
  prenom text,
  photo_url text,
  ville text,
  commune text,
  verification_level public.verification_level not null default 'phone',
  is_active boolean not null default true,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);
create index profiles_ville_idx on public.profiles (ville);

-- Rôle de l'utilisateur courant (SECURITY DEFINER pour éviter la récursion RLS).
create or replace function public.app_current_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- ---------- candidate_profiles ---------------------------------------------
create table public.candidate_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  services public.service_type[] not null default '{}',
  experience_annees smallint not null default 0,
  competences text[] not null default '{}',
  disponibilite text,
  temps_plein boolean not null default true,
  description text,
  salaire_souhaite integer,               -- FCFA, nullable
  is_active_paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index candidate_services_idx on public.candidate_profiles using gin (services);

-- ---------- employer_profiles ----------------------------------------------
create table public.employer_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  type_besoin text,
  description text,
  nb_personnes_foyer smallint,
  type_logement text,
  horaires text,
  salaire_propose integer,                -- FCFA, nullable
  conditions text,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- offers ----------------------------------------------------------
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  titre text not null,
  type_service public.service_type not null,
  description text,
  ville text not null,
  commune text,
  quartier text,
  horaires text,
  salaire integer,                        -- FCFA, nullable
  type_contrat text,
  logee boolean,
  date_debut date,
  experience_souhaitee smallint,
  conditions text,
  status public.offer_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index offers_employer_idx on public.offers (employer_id);
create index offers_status_idx on public.offers (status);
create index offers_ville_service_idx on public.offers (ville, type_service);

-- ---------- applications ----------------------------------------------------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  status public.application_status not null default 'en_attente',
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offer_id, candidate_id)
);
create index applications_offer_idx on public.applications (offer_id);
create index applications_candidate_idx on public.applications (candidate_id);

-- ---------- favorites (employeur → candidate) ------------------------------
create table public.favorites (
  employer_id uuid not null references public.profiles(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (employer_id, candidate_id)
);

-- ---------- ratings ---------------------------------------------------------
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  role_context public.rating_context not null,
  ponctualite smallint check (ponctualite between 1 and 5),
  serieux smallint check (serieux between 1 and 5),
  qualite smallint check (qualite between 1 and 5),
  respect smallint check (respect between 1 and 5),
  communication smallint check (communication between 1 and 5),
  note_moyenne numeric(2,1),
  commentaire text,
  created_at timestamptz not null default now(),
  unique (from_user, to_user, role_context)
);
create index ratings_to_user_idx on public.ratings (to_user);

-- ---------- reports ---------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles(id) on delete cascade,
  target_user uuid not null references public.profiles(id) on delete cascade,
  motif public.report_motif not null,
  description text,
  status public.report_status not null default 'ouvert',
  created_at timestamptz not null default now()
);
create index reports_status_idx on public.reports (status);

-- ---------- payments --------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  montant integer not null,               -- FCFA
  moyen public.payment_method not null,
  reference_transaction text,
  statut public.payment_status not null default 'en_attente',
  type public.payment_type not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_user_idx on public.payments (user_id);

-- ---------- notifications ---------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  titre text not null,
  message text,
  lu boolean not null default false,
  data jsonb,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, lu);

-- ---------- conversations / messages (messagerie, activée plus tard) -------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  offer_id uuid references public.offers(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (employer_id, candidate_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  contenu text not null,
  lu boolean not null default false,
  created_at timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- ---------- settings (tarifs configurables) --------------------------------
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- otp_codes (flux OTP applicatif ; utile même avec provider réel) -
create table public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed boolean not null default false,
  attempts smallint not null default 0,
  created_at timestamptz not null default now()
);
create index otp_codes_phone_idx on public.otp_codes (phone, created_at desc);

-- ---------- Triggers updated_at --------------------------------------------
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_candidate_updated before update on public.candidate_profiles
  for each row execute function public.set_updated_at();
create trigger trg_employer_updated before update on public.employer_profiles
  for each row execute function public.set_updated_at();
create trigger trg_offers_updated before update on public.offers
  for each row execute function public.set_updated_at();
create trigger trg_applications_updated before update on public.applications
  for each row execute function public.set_updated_at();
create trigger trg_payments_updated before update on public.payments
  for each row execute function public.set_updated_at();
