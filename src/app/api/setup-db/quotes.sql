-- Tabla para Cotizaciones (Quotes)
create table if not exists public.quotes (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients(id) on delete set null,
  origin text not null,
  destination text not null,
  equipment_type text,
  price numeric,
  currency text default 'MXN',
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id)
);

-- Políticas de Seguridad (RLS)
alter table public.quotes enable row level security;

-- Políticas de lectura
create policy "Enable read access for all users" on public.quotes for select using (true);

-- Políticas de escritura (solo autenticados)
create policy "Enable insert for authenticated users only" on public.quotes for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.quotes for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on public.quotes for delete using (auth.role() = 'authenticated');
