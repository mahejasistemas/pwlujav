-- Script para rellenar datos faltantes en Profiles
-- Este script asegura que todos los usuarios tengan su perfil creado y sus datos (avatar, nombre) sincronizados.

-- 1. Insertar perfiles faltantes para usuarios existentes en auth.users
insert into public.profiles (id, email, full_name, avatar_url, role, created_at, updated_at)
select
  id,
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url',
  'user', -- Rol por defecto
  created_at,
  coalesce(last_sign_in_at, created_at)
from auth.users
where not exists (select 1 from public.profiles where profiles.id = auth.users.id);

-- 2. Actualizar perfiles existentes con datos de metadatos (si están vacíos en profiles)
update public.profiles
set
  full_name = coalesce(profiles.full_name, auth.users.raw_user_meta_data->>'full_name'),
  avatar_url = coalesce(profiles.avatar_url, auth.users.raw_user_meta_data->>'avatar_url'),
  email = coalesce(profiles.email, auth.users.email)
from auth.users
where profiles.id = auth.users.id
  and (profiles.full_name is null or profiles.avatar_url is null);

-- 3. Confirmar resultados
select count(*) as perfiles_actualizados from public.profiles;
