-- ============================================================================
-- Sécurité — S8 : durcir le bucket `avatars`.
-- La validation type/taille était uniquement côté client. On l'impose au niveau
-- du Storage (serveur) : images seulement, 5 Mio max.
-- ============================================================================

update storage.buckets
set
  file_size_limit = 5242880, -- 5 Mio
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'avatars';
