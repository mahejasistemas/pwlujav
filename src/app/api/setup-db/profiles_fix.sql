-- 1. Asegurar que la tabla profiles exista con la estructura correcta
-- Intentamos crearla, si ya existe, agregamos las columnas que falten
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('admin', 'user', 'moderator')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Corrección: Asegurar que las columnas existan si la tabla ya fue creada previamente
-- Esto evita el error "column full_name does not exist" si la tabla se creó con otro esquema
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

-- 3. Habilitar RLS
alter table public.profiles enable row level security;

-- 4. Políticas de seguridad (Re-creación segura)
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using ( true );

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert with check ( auth.uid() = id );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using ( auth.uid() = id );

-- 5. Función Trigger Corregida
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

-- 6. Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. Backfill (Datos existentes)
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
