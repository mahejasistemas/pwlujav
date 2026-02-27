-- Script unificado para inicialización de Perfiles y Roles
-- Este script crea la tabla profiles (si no existe), asegura su estructura,
-- define los roles, habilita RLS y configura los triggers.

-- 1. Tabla Profiles (Estructura base)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  -- Creamos columna role con default 'user' y check temporal (se actualizará más abajo)
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Asegurar Columnas (Si la tabla ya existía con otro esquema)
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'full_name') then
    alter table public.profiles add column full_name text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'avatar_url') then
    alter table public.profiles add column avatar_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'role') then
    alter table public.profiles add column role text default 'user';
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'created_at') then
    alter table public.profiles add column created_at timestamp with time zone default timezone('utc'::text, now());
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'updated_at') then
    alter table public.profiles add column updated_at timestamp with time zone default timezone('utc'::text, now());
  end if;
end $$;

-- 3. Configurar Restricción de Roles
do $$ 
begin
  -- Intentar eliminar constraints antiguos si existen
  alter table public.profiles drop constraint if exists profiles_role_check;
  
  -- Añadir constraint actualizado
  alter table public.profiles add constraint profiles_role_check 
  check (role in ('admin', 'user', 'sistemas'));
exception
  when duplicate_object then null;
  when others then null;
end $$;

-- Actualizar roles inválidos a 'user' por seguridad
update public.profiles 
set role = 'user' 
where role not in ('admin', 'user', 'sistemas');

-- 4. Habilitar RLS
alter table public.profiles enable row level security;

-- 5. Políticas de Seguridad (RLS)
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using ( true );

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert with check ( auth.uid() = id );

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can update own basic info" on public.profiles;
-- Usuarios editan sus propios datos
create policy "Users can update own basic info" on public.profiles
  for update using ( auth.uid() = id );

drop policy if exists "Admins can update all profiles" on public.profiles;
-- Admins editan todo
create policy "Admins can update all profiles" on public.profiles
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- 6. Trigger para Sincronización Automática con Auth (Nuevos Usuarios)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.created_at,
    coalesce(new.last_sign_in_at, new.created_at, now())
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Trigger para Proteger Cambios de Rol (Prevent Escalation)
create or replace function public.prevent_role_escalation()
returns trigger as $$
begin
  -- Permitir si es operación de sistema (auth.uid() nulo) o primer setup
  if auth.uid() is null then
     return new;
  end if;

  -- Verificar si el usuario actual es admin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    -- Si no es admin y trata de cambiar el rol, bloquear
    if new.role <> old.role then
      raise exception 'Solo los administradores pueden cambiar roles.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists check_role_change on public.profiles;
create trigger check_role_change
  before update on public.profiles
  for each row execute procedure public.prevent_role_escalation();

-- 8. Backfill (Reparación de datos existentes)
-- Sincroniza usuarios que existan en Auth pero no en Profiles
insert into public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
select 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url',
  coalesce(created_at, now()),
  coalesce(last_sign_in_at, created_at, now())
from auth.users
on conflict (id) do update 
set 
  email = excluded.email,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  created_at = excluded.created_at,
  updated_at = coalesce(excluded.updated_at, now());
