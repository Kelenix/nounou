-- ============================================================================
-- Permet à un participant de marquer comme lus les messages qu'il a REÇUS
-- (il manquait une politique UPDATE sur `messages`, d'où un badge qui restait).
-- On restreint aux messages non envoyés par soi (donc reçus) dans ses conversations.
-- ============================================================================
create policy "messages_update_read_participant" on public.messages
  for update
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.employer_id = auth.uid() or c.candidate_id = auth.uid())
    )
  )
  with check (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.employer_id = auth.uid() or c.candidate_id = auth.uid())
    )
  );
