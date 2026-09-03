-- ============================================================================
-- Sécurité — S5/S6 : limitation de débit applicative.
--   1) Signalements : max 10 / heure / utilisateur (anti-spam de modération).
--   2) Révélation de contact (candidate_phone) : journalisée + plafonnée à
--      30 / heure / utilisateur (anti-moissonnage de numéros).
-- ============================================================================

-- ---------- 1) Anti-spam signalements --------------------------------------
create or replace function public.reports_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  if auth.uid() is null then
    return new; -- opérations serveur de confiance
  end if;
  select count(*) into recent
  from public.reports
  where from_user = auth.uid()
    and created_at > now() - interval '1 hour';
  if recent >= 10 then
    raise exception 'Trop de signalements en peu de temps. Réessayez plus tard.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_reports_rate_limit on public.reports;
create trigger trg_reports_rate_limit
  before insert on public.reports
  for each row execute function public.reports_rate_limit();

-- ---------- 2) Journal + plafond des révélations de contact ----------------
create table if not exists public.contact_reveals (
  id bigint generated always as identity primary key,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  candidate_id uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists contact_reveals_viewer_time_idx
  on public.contact_reveals (viewer_id, created_at desc);

alter table public.contact_reveals enable row level security;
-- Lecture réservée aux admins (traçabilité) ; écriture uniquement via la
-- fonction SECURITY DEFINER ci-dessous (aucune policy insert).
create policy "contact_reveals_select_admin" on public.contact_reveals
  for select using (public.is_admin());

-- Réécriture de `candidate_phone` : plafond horaire + journalisation.
-- (Passe en VOLATILE car la fonction écrit désormais une ligne de journal.)
create or replace function public.candidate_phone(candidate uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  viewer uuid := auth.uid();
  recent int;
  ph text;
begin
  if viewer is null then
    return null; -- non connecté : jamais de téléphone
  end if;

  select count(*) into recent
  from public.contact_reveals
  where viewer_id = viewer
    and created_at > now() - interval '1 hour';
  if recent >= 30 then
    raise exception 'Limite de consultations de contacts atteinte. Réessayez plus tard.';
  end if;

  select phone into ph
  from public.profiles
  where id = candidate and role = 'candidate';
  if ph is null then
    return null;
  end if;

  insert into public.contact_reveals (viewer_id, candidate_id)
  values (viewer, candidate);

  return ph;
end;
$$;

revoke all on function public.candidate_phone(uuid) from public, anon;
grant execute on function public.candidate_phone(uuid) to authenticated;
