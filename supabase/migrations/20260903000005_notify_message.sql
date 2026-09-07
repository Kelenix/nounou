-- Notification à la réception d'un nouveau message (cloche + temps réel).
-- Le destinataire est l'autre partie de la conversation (pas l'expéditeur).
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_recipient uuid;
  v_sender_name text;
begin
  -- Destinataire = l'autre membre de la conversation.
  select case when c.employer_id = new.sender_id then c.candidate_id else c.employer_id end
    into v_recipient
    from public.conversations c
    where c.id = new.conversation_id;

  if v_recipient is null or v_recipient = new.sender_id then
    return new;
  end if;

  select nullif(trim(coalesce(p.prenom, '') || ' ' || coalesce(p.nom, '')), '')
    into v_sender_name
    from public.profiles p
    where p.id = new.sender_id;

  insert into public.notifications (user_id, type, titre, message, data)
  values (
    v_recipient,
    'nouveau_message',
    'Nouveau message',
    coalesce(v_sender_name, 'Quelqu''un') || ' vous a envoyé un message.',
    jsonb_build_object('conversation_id', new.conversation_id, 'message_id', new.id)
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message
  after insert on public.messages
  for each row execute function public.notify_new_message();
