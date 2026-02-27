-- Tabla para Tarifas Manzanillo
create table if not exists public.manzanillo (
  id uuid default gen_random_uuid() primary key,
  origen text not null,
  destino text not null,
  rabon numeric,
  sencillo numeric,
  sencillo_sobrepeso numeric,
  full numeric,
  full_sobrepeso numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla para Tarifas Veracruz
create table if not exists public.veracruz (
  id uuid default gen_random_uuid() primary key,
  origen text not null,
  destino text not null,
  rabon numeric,
  sencillo numeric,
  sencillo_sobrepeso numeric,
  full numeric,
  full_sobrepeso numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla para Tarifas Altamira
create table if not exists public.altamira (
  id uuid default gen_random_uuid() primary key,
  origen text not null,
  destino text not null,
  rabon numeric,
  sencillo numeric,
  sencillo_sobrepeso numeric,
  full numeric,
  full_sobrepeso numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Políticas de Seguridad (RLS)
alter table public.manzanillo enable row level security;
alter table public.veracruz enable row level security;
alter table public.altamira enable row level security;

-- Políticas de lectura (pública por ahora, o restringida)
create policy "Enable read access for all users" on public.manzanillo for select using (true);
create policy "Enable read access for all users" on public.veracruz for select using (true);
create policy "Enable read access for all users" on public.altamira for select using (true);

-- Políticas de escritura (solo autenticados)
create policy "Enable insert for authenticated users only" on public.manzanillo for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.manzanillo for update using (auth.role() = 'authenticated');
create policy "Enable insert for authenticated users only" on public.veracruz for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.veracruz for update using (auth.role() = 'authenticated');
create policy "Enable insert for authenticated users only" on public.altamira for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.altamira for update using (auth.role() = 'authenticated');
