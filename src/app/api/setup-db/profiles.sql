-- 1. Crear tabla de perfiles públicos
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('admin', 'user', 'moderator')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilitar RLS
alter table public.profiles enable row level security;

-- 3. Políticas de seguridad
-- Permitir lectura pública de perfiles (necesario para que los usuarios vean a otros usuarios en listas, o restringir a auth)
create policy "Public profiles are viewable by everyone" 
on public.profiles for select 
using ( true );

-- Permitir a los usuarios editar su propio perfil
create policy "Users can insert their own profile" 
on public.profiles for insert 
with check ( auth.uid() = id );

create policy "Users can update own profile" 
on public.profiles for update 
using ( auth.uid() = id );

-- 4. Función para manejar nuevos usuarios automáticamente
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 5. Trigger que se dispara al crear un usuario en Auth
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. (Opcional) Backfill: Crear perfiles para usuarios YA existentes en Auth
insert into public.profiles (id, email, full_name, avatar_url)
select 
  id, 
  email, 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;
