-- ============================================================================
-- Navigation publique (marketplace) : autoriser la lecture SANS connexion des
-- prestataires activés, des employeurs (pour le détail d'offre) et des notes.
-- Les offres actives sont déjà publiques (cf. 20260901000003_rls.sql).
-- Le téléphone reste protégé (jamais dans la vue `public_profiles`).
-- ============================================================================

-- Prestataires (candidates) activés = visibles publiquement.
drop policy if exists "candidate_select_auth" on public.candidate_profiles;
create policy "candidate_select_public" on public.candidate_profiles
  for select using (
    is_active_paid or user_id = auth.uid() or public.is_admin()
  );

-- Profil employeur : lecture publique (infos non sensibles ; sert au détail d'offre).
drop policy if exists "employer_select_auth" on public.employer_profiles;
create policy "employer_select_public" on public.employer_profiles
  for select using (true);

-- Notes : lecture publique (affichées sur les fiches).
drop policy if exists "ratings_select_auth" on public.ratings;
create policy "ratings_select_public" on public.ratings
  for select using (true);
