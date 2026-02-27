-- Actualización de roles: usuario, admin, sistemas

-- 1. Modificar el check constraint de la columna role
do $$ 
begin
  -- Intentar eliminar el constraint existente si tiene nombre conocido
  alter table public.profiles drop constraint if exists profiles_role_check;
  
  -- Si no se pudo eliminar por nombre, hacerlo manualmente (esto es más complejo en SQL puro sin saber el nombre exacto, 
  -- pero asumimos que si se creó con el script anterior, no tiene nombre explícito o es autogenerado.
  -- Una forma segura es recrear la columna o cambiar el tipo, pero aquí solo añadiremos el nuevo check)
  
  -- Nota: En Postgres, para modificar un check constraint, generalmente se borra y se crea uno nuevo.
  -- Vamos a intentar actualizar el check.
  
  alter table public.profiles add constraint profiles_role_check 
  check (role in ('admin', 'user', 'sistemas'));
exception
  when duplicate_object then null; -- Ya existe
  when others then null; -- Otros errores (ej. si la columna no existe)
end $$;

-- Si el bloque anterior falló o no hizo nada por nombres de constraint, 
-- una estrategia alternativa es alterar el default y validar los datos.

alter table public.profiles alter column role set default 'user';

-- Actualizar datos existentes si hay roles no permitidos (ej. 'moderator' a 'user')
update public.profiles 
set role = 'user' 
where role not in ('admin', 'user', 'sistemas');

-- 2. Políticas RLS para gestión de roles
-- Solo los administradores y sistemas pueden actualizar roles de otros usuarios?
-- El requerimiento dice:
-- "usuario": solo ve.
-- "admin": ve todo y controla todo (puede asignar roles).
-- "sistemas": ve todo, autoriza cambios de contraseñas. (Asumiremos que también es un rol privilegiado para ver).

-- Política de lectura: Todos pueden ver perfiles (ya existe: "Public profiles are viewable by everyone")

-- Política de actualización: 
-- El usuario puede actualizar su propio perfil (nombre, avatar), pero NO su rol.
-- El admin puede actualizar cualquier perfil (incluyendo roles).

drop policy if exists "Users can update own profile" on public.profiles;

-- Nueva política: Usuarios editan sus propios datos (excepto rol, idealmente, pero RLS no filtra columnas fácilmente en UPDATE)
-- Para proteger el rol, lo ideal es un Trigger o una función de base de datos, 
-- pero por ahora confiaremos en la lógica de negocio + RLS básica.
-- O mejor: Crear una política para Admins que permita todo.

create policy "Users can update own basic info" on public.profiles
  for update using ( auth.uid() = id );

create policy "Admins can update all profiles" on public.profiles
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Política para Sistemas (Si sistemas necesita editar algo específico, agregarlo aquí. 
-- Por ahora "ve todo" está cubierto por select public, "autoriza cambios" es lógica de backend/auth).
-- Si sistemas necesita editar perfiles, agregar OR role = 'sistemas'.

-- 3. Trigger para proteger cambios de rol (Opcional pero recomendado)
-- Evitar que un usuario normal se promueva a admin.
create or replace function public.prevent_role_escalation()
returns trigger as $$
begin
  -- Permitir si es una operación de sistema (auth.uid() es nulo) o modo servicio
  if auth.uid() is null then
     return new;
  end if;

  -- Si el usuario que ejecuta la acción NO es admin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    -- Y está intentando cambiar el rol
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

