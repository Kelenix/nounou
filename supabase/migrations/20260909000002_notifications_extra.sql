-- ============================================================================
-- Notifications complémentaires (cloche + e-mail via le webhook existant).
--   Alertes ADMIN (tous les comptes role='admin') :
--     • nouveau signalement à traiter ;
--     • nouvelle offre publiée ;
--     • pièce d'identité soumise (à vérifier).
--   Les notifications « utilisateur » (profil vérifié/refusé, actions sur le
--   compte, annonce système) sont créées côté application (service_role).
-- ============================================================================

-- Helper : notifie TOUS les administrateurs. SECURITY DEFINER pour insérer
-- malgré la RLS, quel que soit l'auteur de l'action déclencheuse.
create or replace function public.notify_admins(
  p_type public.notification_type,
  p_titre text,
  p_message text,
  p_data jsonb default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, titre, message, data)
  select id, p_type, p_titre, p_message, p_data
  from public.profiles
  where role = 'admin';
end;
$$;

-- ---------- Nouveau signalement -> admins -----------------------------------
create or replace function public.notify_report_admins()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_admins(
    'signalement', 'Nouveau signalement',
    'Un nouveau signalement a été déposé et attend d''être traité.',
    jsonb_build_object('report_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_report_admins on public.reports;
create trigger trg_notify_report_admins
  after insert on public.reports
  for each row execute function public.notify_report_admins();

-- ---------- Nouvelle offre -> admins ----------------------------------------
create or replace function public.notify_offer_admins()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_admins(
    'systeme', 'Nouvelle offre publiée',
    'Une nouvelle offre a été publiée : « ' || coalesce(new.titre, '') || ' ».',
    jsonb_build_object('offer_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_offer_admins on public.offers;
create trigger trg_notify_offer_admins
  after insert on public.offers
  for each row execute function public.notify_offer_admins();

-- ---------- Pièce d'identité soumise -> admins (à vérifier) ------------------
create or replace function public.notify_identity_pending_admins()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Se déclenche quand une pièce est (re)déposée alors que le compte est encore
  -- au niveau de base ('phone') : c'est exactement la file de vérification.
  if new.identity_doc_path is not null
     and new.identity_doc_path is distinct from old.identity_doc_path
     and new.verification_level = 'phone' then
    perform public.notify_admins(
      'systeme', 'Pièce à vérifier',
      'Une candidate a soumis une pièce d''identité à vérifier.',
      jsonb_build_object('user_id', new.id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_identity_pending on public.profiles;
create trigger trg_notify_identity_pending
  after update on public.profiles
  for each row execute function public.notify_identity_pending_admins();
