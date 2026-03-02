-- 1. Crear tabla consolidada 'tarifas_generales'
CREATE TABLE IF NOT EXISTS public.tarifas_generales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  origen text NOT NULL,
  destino text NOT NULL,
  rabon numeric,
  sencillo numeric,
  sencillo_sobrepeso numeric,
  "full" numeric,
  full_sobrepeso numeric,
  base_origen text NOT NULL CHECK (base_origen IN ('Manzanillo', 'Veracruz', 'Altamira')), -- Para saber de dónde viene
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS y Lectura Pública
ALTER TABLE public.tarifas_generales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura publica tarifas_generales" ON public.tarifas_generales;
CREATE POLICY "Permitir lectura publica tarifas_generales" 
ON public.tarifas_generales 
FOR SELECT 
TO public 
USING (true);

-- Notificar cambio
NOTIFY pgrst, 'reload config';
