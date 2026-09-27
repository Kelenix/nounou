-- ============================================================================
-- Statistiques techniques pour la page admin « Santé du système ».
-- Uniquement des données réellement mesurées par Postgres / Supabase Auth.
-- Réservée au service_role (appelée côté serveur, page Super Admin).
-- ============================================================================

create or replace function public.system_health_stats()
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  r jsonb;
begin
  r := jsonb_build_object(
    'db_size_bytes', pg_database_size(current_database()),
    'connections', (select count(*) from pg_catalog.pg_stat_activity where datname = current_database()),
    'max_connections', current_setting('max_connections')::int,
    'deadlocks', (select deadlocks from pg_catalog.pg_stat_database where datname = current_database()),
    'active_sessions', (select count(*) from auth.sessions where not_after is null or not_after > now()),
    'active_users_24h', (select count(distinct user_id) from auth.sessions where updated_at > now() - interval '24 hours'),
    'sign_ins_24h', (select count(*) from auth.users where last_sign_in_at > now() - interval '24 hours')
  );

  -- pg_stat_statements peut être absent ou non lisible : on ignore alors ces métriques.
  begin
    r := r || (
      select jsonb_build_object(
        'avg_query_ms', round((sum(total_exec_time) / nullif(sum(calls), 0))::numeric, 1),
        'slow_queries', count(*) filter (where mean_exec_time > 500)
      )
      from extensions.pg_stat_statements
      where dbid = (select oid from pg_catalog.pg_database where datname = current_database())
    );
  exception when others then
    null;
  end;

  return r;
end;
$$;

revoke all on function public.system_health_stats() from public, anon, authenticated;
grant execute on function public.system_health_stats() to service_role;
