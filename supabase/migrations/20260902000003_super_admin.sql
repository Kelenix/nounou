-- ============================================================================
-- Hiérarchie Super Admin > Admin/Staff > Utilisateur + permissions + audit.
-- Protections appliquées AU NIVEAU BASE (triggers) pour ne pas dépendre du front.
-- ============================================================================

-- Colonnes de hiérarchie / permissions.
alter table public.profiles
  add column if not exists is_super_admin boolean not null default false,
  add column if not exists staff_permissions text[] not null default '{}';

-- Un seul Super Admin par défaut (garanti par un index partiel unique).
create unique index if not exists one_super_admin_idx
  on public.profiles ((true)) where is_super_admin;

-- Helper : l'appelant est-il Super Admin ?
create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_super_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------- Protection du Super Admin (backend) ----------------------------
-- Empêche toute suppression du Super Admin, et toute modification (rôle,
-- statut, permissions) par quelqu'un d'autre que lui-même. Empêche aussi la
-- rétrogradation de son propre compte.
create or replace function public.protect_super_admin()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.is_super_admin then
      raise exception 'Le Super Admin ne peut pas être supprimé';
    end if;
    return old;
  end if;

  -- UPDATE
  if old.is_super_admin then
    if auth.uid() is distinct from old.id then
      raise exception 'Seul le Super Admin peut modifier son propre compte';
    end if;
    if (new.is_super_admin is distinct from true)
       or (new.role is distinct from 'admin'::public.user_role)
       or (new.is_suspended is distinct from false) then
      raise exception 'Le Super Admin ne peut pas être rétrogradé, désactivé ou suspendu';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_super_admin on public.profiles;
create trigger trg_protect_super_admin
  before update or delete on public.profiles
  for each row execute function public.protect_super_admin();

-- ---------- Journal d'audit des actions sensibles --------------------------
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text,
  action text not null,
  target_id uuid,
  target_name text,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_created_idx on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;
-- Lecture réservée aux admins ; écriture uniquement via service_role (aucune policy insert).
create policy "audit_select_admin" on public.admin_audit_log
  for select using (public.is_admin());
