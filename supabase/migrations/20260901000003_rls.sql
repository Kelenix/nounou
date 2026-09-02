-- ============================================================================
-- Row Level Security — activée sur TOUTES les tables.
-- Principe : un utilisateur n'accède qu'à ses données ; l'admin a un accès élargi ;
-- les données « professionnelles » publiques passent par des politiques de lecture
-- ciblées ou par la vue `public_profiles` (qui masque le téléphone).
-- ============================================================================

alter table public.profiles            enable row level security;
alter table public.candidate_profiles  enable row level security;
alter table public.employer_profiles   enable row level security;
alter table public.offers              enable row level security;
alter table public.applications        enable row level security;
alter table public.favorites           enable row level security;
alter table public.ratings             enable row level security;
alter table public.reports             enable row level security;
alter table public.payments            enable row level security;
alter table public.notifications       enable row level security;
alter table public.conversations       enable row level security;
alter table public.messages            enable row level security;
alter table public.settings            enable row level security;
alter table public.otp_codes           enable row level security;

-- ---------- profiles --------------------------------------------------------
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
create policy "profiles_insert_self" on public.profiles
  for insert with check (id = auth.uid());

-- Vue publique sûre (colonnes non sensibles) — sert au navigateur pour afficher
-- nom/photo/ville des autres utilisateurs sans exposer le téléphone.
create view public.public_profiles as
  select id, role, nom, prenom, photo_url, ville, commune,
         verification_level, is_active, is_suspended, created_at
  from public.profiles;
grant select on public.public_profiles to anon, authenticated;

-- ---------- candidate_profiles ---------------------------------------------
create policy "candidate_select_auth" on public.candidate_profiles
  for select using (auth.uid() is not null);
create policy "candidate_write_own_or_admin" on public.candidate_profiles
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ---------- employer_profiles ----------------------------------------------
create policy "employer_select_auth" on public.employer_profiles
  for select using (auth.uid() is not null);
create policy "employer_write_own_or_admin" on public.employer_profiles
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ---------- offers ----------------------------------------------------------
create policy "offers_select_active_or_owner" on public.offers
  for select using (
    status = 'active' or employer_id = auth.uid() or public.is_admin()
  );
create policy "offers_insert_employer" on public.offers
  for insert with check (
    employer_id = auth.uid() and public.app_current_role() = 'employer'
  );
create policy "offers_update_owner_or_admin" on public.offers
  for update using (employer_id = auth.uid() or public.is_admin())
  with check (employer_id = auth.uid() or public.is_admin());
create policy "offers_delete_owner_or_admin" on public.offers
  for delete using (employer_id = auth.uid() or public.is_admin());

-- ---------- applications ----------------------------------------------------
create policy "applications_select_involved" on public.applications
  for select using (
    candidate_id = auth.uid()
    or exists (select 1 from public.offers o
               where o.id = offer_id and o.employer_id = auth.uid())
    or public.is_admin()
  );
create policy "applications_insert_candidate" on public.applications
  for insert with check (
    candidate_id = auth.uid() and public.app_current_role() = 'candidate'
  );
create policy "applications_update_involved" on public.applications
  for update using (
    candidate_id = auth.uid()
    or exists (select 1 from public.offers o
               where o.id = offer_id and o.employer_id = auth.uid())
    or public.is_admin()
  );

-- ---------- favorites -------------------------------------------------------
create policy "favorites_own" on public.favorites
  for all using (employer_id = auth.uid() or public.is_admin())
  with check (employer_id = auth.uid());

-- ---------- ratings ---------------------------------------------------------
create policy "ratings_select_auth" on public.ratings
  for select using (auth.uid() is not null);
create policy "ratings_insert_from_self" on public.ratings
  for insert with check (from_user = auth.uid());
create policy "ratings_update_from_self" on public.ratings
  for update using (from_user = auth.uid()) with check (from_user = auth.uid());
create policy "ratings_delete_admin" on public.ratings
  for delete using (public.is_admin());

-- ---------- reports ---------------------------------------------------------
create policy "reports_select_own_or_admin" on public.reports
  for select using (from_user = auth.uid() or public.is_admin());
create policy "reports_insert_from_self" on public.reports
  for insert with check (from_user = auth.uid());
create policy "reports_update_admin" on public.reports
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- payments --------------------------------------------------------
create policy "payments_select_own_or_admin" on public.payments
  for select using (user_id = auth.uid() or public.is_admin());
create policy "payments_insert_own" on public.payments
  for insert with check (user_id = auth.uid());
create policy "payments_update_admin" on public.payments
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- notifications ---------------------------------------------------
create policy "notifications_select_own_or_admin" on public.notifications
  for select using (user_id = auth.uid() or public.is_admin());
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_insert_admin" on public.notifications
  for insert with check (public.is_admin());

-- ---------- conversations ---------------------------------------------------
create policy "conversations_participants" on public.conversations
  for select using (
    employer_id = auth.uid() or candidate_id = auth.uid() or public.is_admin()
  );
create policy "conversations_insert_participant" on public.conversations
  for insert with check (employer_id = auth.uid() or candidate_id = auth.uid());
create policy "conversations_update_participant" on public.conversations
  for update using (employer_id = auth.uid() or candidate_id = auth.uid());

-- ---------- messages --------------------------------------------------------
create policy "messages_select_participant" on public.messages
  for select using (
    exists (select 1 from public.conversations c
            where c.id = conversation_id
              and (c.employer_id = auth.uid() or c.candidate_id = auth.uid()))
    or public.is_admin()
  );
create policy "messages_insert_sender" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (select 1 from public.conversations c
                where c.id = conversation_id
                  and (c.employer_id = auth.uid() or c.candidate_id = auth.uid()))
  );

-- ---------- settings (tarifs) : lecture publique, écriture admin -----------
create policy "settings_select_all" on public.settings
  for select using (true);
create policy "settings_write_admin" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- otp_codes : aucun accès direct (service_role uniquement) -------
-- RLS activée sans politique => refus par défaut pour anon/authenticated.
