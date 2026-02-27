-- Script de creación de Workspaces y Miembros
-- Este script crea las tablas necesarias para la gestión de equipos y configura la seguridad (RLS).

-- 1. Tabla de Workspaces
create table if not exists public.workspaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  base text not null, -- 'Manzanillo', 'Veracruz', etc.
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabla de Miembros del Workspace
create table if not exists public.workspace_members (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'member', 'viewer')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(workspace_id, user_id)
);

-- Asegurar constraints explícitas (Foreign Key)
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

-- 3. Habilitar RLS
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

-- 4. Función de seguridad para evitar recursión infinita
-- Permite verificar membresía saltándose las políticas RLS (Security Definer)
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

-- 5. Políticas para Workspaces

-- Limpieza de políticas antiguas
drop policy if exists "Users can view workspaces they are member of" on public.workspaces;
drop policy if exists "Admins can manage workspaces" on public.workspaces;

-- Lectura: Miembros del workspace O Admins globales
create policy "Users can view workspaces they are member of" on public.workspaces
  for select using (
    public.is_member_of(id)
    or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Escritura (Insert/Update/Delete): Solo Admins globales
create policy "Admins can manage workspaces" on public.workspaces
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- 6. Políticas para Workspace Members

-- Limpieza de políticas antiguas
drop policy if exists "Users can view members of their workspaces" on public.workspace_members;
drop policy if exists "Admins can manage workspace members" on public.workspace_members;

-- Lectura: Ver miembros de mis workspaces (Usando función segura)
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

-- Escritura: Solo Admins globales (por ahora, luego se podría permitir a admins del workspace)
create policy "Admins can manage workspace members" on public.workspace_members
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- 7. Insertar un workspace por defecto si no existe
insert into public.workspaces (name, base)
select 'Transportes Lujav', 'General'
where not exists (select 1 from public.workspaces);

-- 8. Notificar recarga de caché
notify pgrst, 'reload config';
