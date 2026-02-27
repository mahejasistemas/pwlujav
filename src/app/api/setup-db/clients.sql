-- Tabla para Empresas (Companies)
create table if not exists public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  employees_count int default 1,
  logo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla para Clientes (Clients)
create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  company text not null,
  date timestamp with time zone default timezone('utc'::text, now()),
  location text,
  status text check (status in ('completado', 'en_proceso', 'sin_exito')),
  service_type text,
  quotes_count int default 0,
  logo text,
  phone text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Políticas de Seguridad (RLS)
alter table public.companies enable row level security;
alter table public.clients enable row level security;

-- Permitir lectura pública (o restringir según auth)
create policy "Enable read access for all users" on public.companies for select using (true);
create policy "Enable insert for authenticated users only" on public.companies for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.companies for update using (auth.role() = 'authenticated');

create policy "Enable read access for all users" on public.clients for select using (true);
create policy "Enable insert for authenticated users only" on public.clients for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.clients for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on public.clients for delete using (auth.role() = 'authenticated');
