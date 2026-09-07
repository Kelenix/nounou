-- ============================================================================
-- Vérification d'identité (Phase C).
--   - `profiles.identity_doc_path` : chemin de la pièce téléversée (bucket privé).
--   - Bucket PRIVÉ `identity-docs` : jamais public. L'utilisateur ne lit/écrit
--     que son propre dossier ; les admins consultent via `service_role` (URL
--     signées générées côté serveur).
--   - Le passage du `verification_level` à « identity » se fait côté admin
--     (service_role), le garde S1 empêchant l'utilisateur de se vérifier seul.
-- ============================================================================
alter table public.profiles add column if not exists identity_doc_path text;

insert into storage.buckets (id, name, public)
values ('identity-docs', 'identity-docs', false)
on conflict (id) do nothing;

create policy "iddocs_insert_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'identity-docs' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "iddocs_select_own" on storage.objects
  for select to authenticated using (
    bucket_id = 'identity-docs' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "iddocs_update_own" on storage.objects
  for update to authenticated using (
    bucket_id = 'identity-docs' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "iddocs_delete_own" on storage.objects
  for delete to authenticated using (
    bucket_id = 'identity-docs' and (storage.foldername(name))[1] = auth.uid()::text
  );
