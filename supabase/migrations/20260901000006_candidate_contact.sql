-- ============================================================================
-- Contact d'un prestataire : le téléphone reste privé publiquement, mais est
-- révélé aux utilisateurs CONNECTÉS (pour contacter / appeler / WhatsApp).
-- SECURITY DEFINER : contourne la RLS de `profiles` de façon contrôlée.
-- ============================================================================
create or replace function public.candidate_phone(candidate uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then null
    else (select phone from public.profiles where id = candidate and role = 'candidate')
  end;
$$;

revoke all on function public.candidate_phone(uuid) from public, anon;
grant execute on function public.candidate_phone(uuid) to authenticated;
