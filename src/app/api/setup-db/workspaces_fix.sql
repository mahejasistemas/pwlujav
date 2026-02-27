-- Script de corrección integral para Workspaces
-- Ejecuta este script en el Editor SQL de Supabase para solucionar los errores de relación y recursión.

-- 1. Asegurar que las tablas existen
create table if not exists public.workspaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  base text not null,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.workspace_members (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'member', 'viewer')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(workspace_id, user_id)
);

-- 2. Asegurar que la relación (Foreign Key) existe explícitamente
-- Esto soluciona el error "Could not find a relationship..."
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'workspace_members_workspace_id_fkey'
  ) then
    alter table public.workspace_members
    add constraint workspace_members_workspace_id_fkey
    foreign key (workspace_id)
    references public.workspaces(id)
    on delete cascade;
  end if;
end $$;

-- 3. Función de seguridad para evitar recursión infinita
-- Esto soluciona el error "infinite recursion detected in policy"
create or replace function public.is_member_of(_workspace_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.workspace_members
    where workspace_id = _workspace_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- 4. Reaplicar Políticas RLS
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

-- Limpiar políticas antiguas para evitar duplicados
drop policy if exists "Users can view workspaces they are member of" on public.workspaces;
drop policy if exists "Admins can manage workspaces" on public.workspaces;
drop policy if exists "Users can view members of their workspaces" on public.workspace_members;
drop policy if exists "Admins can manage workspace members" on public.workspace_members;

-- Políticas de Workspaces
create policy "Users can view workspaces they are member of" on public.workspaces
  for select using (
    public.is_member_of(id) -- Usamos la función aquí también por consistencia
    or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Admins can manage workspaces" on public.workspaces
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Políticas de Members (Usando la función segura)
create policy "Users can view members of their workspaces" on public.workspace_members
  for select using (
    public.is_member_of(workspace_id)
    or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Admins can manage workspace members" on public.workspace_members
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- 5. Forzar recarga del caché de esquema
notify pgrst, 'reload config';
