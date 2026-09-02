-- ============================================================================
-- Active Supabase Realtime sur les tables temps réel (la publication
-- `supabase_realtime` existe par défaut). La diffusion respecte la RLS :
-- chaque client ne reçoit que les lignes que ses politiques SELECT autorisent.
-- ============================================================================
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;

-- REPLICA IDENTITY FULL : nécessaire pour recevoir les anciennes valeurs sur
-- les UPDATE/DELETE (utile pour la messagerie et le statut « lu »).
alter table public.messages replica identity full;
alter table public.notifications replica identity full;
