-- Habilitar RLS y acceso público para Manzanillo
ALTER TABLE public.manzanillo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura publica manzanillo" ON public.manzanillo;
CREATE POLICY "Permitir lectura publica manzanillo" 
ON public.manzanillo 
FOR SELECT 
TO public 
USING (true);

-- Habilitar RLS y acceso público para Veracruz
ALTER TABLE public.veracruz ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura publica veracruz" ON public.veracruz;
CREATE POLICY "Permitir lectura publica veracruz" 
ON public.veracruz 
FOR SELECT 
TO public 
USING (true);

-- Habilitar RLS y acceso público para Altamira
ALTER TABLE public.altamira ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura publica altamira" ON public.altamira;
CREATE POLICY "Permitir lectura publica altamira" 
ON public.altamira 
FOR SELECT 
TO public 
USING (true);

-- Habilitar RLS y acceso público para Carga General (Equipos)
ALTER TABLE public.carga_general ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir lectura publica carga_general" ON public.carga_general;
CREATE POLICY "Permitir lectura publica carga_general" 
ON public.carga_general 
FOR SELECT 
TO public 
USING (true);

-- Notificar recarga
notify pgrst, 'reload config';
