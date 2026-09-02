-- ============================================================================
-- Triggers métier : création de profil à l'inscription, moyenne des notes,
-- horodatage du dernier message, notification à la candidature.
-- ============================================================================

-- ---------- Création automatique du profil à l'inscription auth ------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone, phone_verified)
  values (
    new.id,
    coalesce(new.phone, new.raw_user_meta_data->>'phone', ''),
    new.phone_confirmed_at is not null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Moyenne des 5 critères d'une note ------------------------------
create or replace function public.compute_rating_average()
returns trigger language plpgsql as $$
begin
  new.note_moyenne := round((
    coalesce(new.ponctualite, 0) + coalesce(new.serieux, 0) + coalesce(new.qualite, 0)
    + coalesce(new.respect, 0) + coalesce(new.communication, 0)
  )::numeric / nullif((
    (new.ponctualite is not null)::int + (new.serieux is not null)::int
    + (new.qualite is not null)::int + (new.respect is not null)::int
    + (new.communication is not null)::int
  ), 0), 1);
  return new;
end;
$$;

create trigger trg_rating_average
  before insert or update on public.ratings
  for each row execute function public.compute_rating_average();

-- ---------- Mise à jour de last_message_at ---------------------------------
create or replace function public.bump_conversation()
returns trigger language plpgsql as $$
begin
  update public.conversations
    set last_message_at = new.created_at
    where id = new.conversation_id;
  return new;
end;
$$;

create trigger trg_bump_conversation
  after insert on public.messages
  for each row execute function public.bump_conversation();

-- ---------- Notification à l'employeur lors d'une nouvelle candidature ------
create or replace function public.notify_new_application()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_employer uuid;
  v_titre text;
begin
  select o.employer_id, o.titre into v_employer, v_titre
    from public.offers o where o.id = new.offer_id;
  insert into public.notifications (user_id, type, titre, message, data)
  values (
    v_employer, 'nouvelle_candidature', 'Nouvelle candidature',
    'Une candidate a postulé à votre offre « ' || coalesce(v_titre, '') || ' ».',
    jsonb_build_object('offer_id', new.offer_id, 'application_id', new.id)
  );
  return new;
end;
$$;

create trigger trg_notify_new_application
  after insert on public.applications
  for each row execute function public.notify_new_application();

-- ---------- Notification à la candidate lors d'un changement de statut ------
create or replace function public.notify_application_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_titre text;
begin
  if new.status = old.status then
    return new;
  end if;
  select o.titre into v_titre from public.offers o where o.id = new.offer_id;
  if new.status = 'acceptee' then
    insert into public.notifications (user_id, type, titre, message, data)
    values (new.candidate_id, 'candidature_acceptee', 'Candidature acceptée',
      'Votre candidature à « ' || coalesce(v_titre, '') || ' » a été acceptée.',
      jsonb_build_object('offer_id', new.offer_id, 'application_id', new.id));
  elsif new.status = 'refusee' then
    insert into public.notifications (user_id, type, titre, message, data)
    values (new.candidate_id, 'candidature_refusee', 'Candidature non retenue',
      'Votre candidature à « ' || coalesce(v_titre, '') || ' » n''a pas été retenue.',
      jsonb_build_object('offer_id', new.offer_id, 'application_id', new.id));
  end if;
  return new;
end;
$$;

create trigger trg_notify_application_status
  after update on public.applications
  for each row execute function public.notify_application_status();
