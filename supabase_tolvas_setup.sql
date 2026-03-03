-- Script SQL para crear la tabla de 'tolvas' y poblarla con datos iniciales

-- 1. Crear la tabla
CREATE TABLE IF NOT EXISTS public.tolvas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio_base NUMERIC DEFAULT 0, -- Precio por tonelada/viaje, puede ser actualizado luego
    capacidad_m3 NUMERIC,
    capacidad_ton NUMERIC
);

-- 2. Habilitar RLS (Row Level Security) como buena práctica
ALTER TABLE public.tolvas ENABLE ROW LEVEL SECURITY;

-- 3. Crear política de lectura pública (cualquiera puede leer las tarifas)
CREATE POLICY "Lectura pública de tolvas" 
ON public.tolvas FOR SELECT 
USING (true);

-- 4. Crear política de escritura (solo autenticados/admin - ajustar según necesidad real)
-- Por ahora permitimos insertar a usuarios autenticados para facilitar pruebas, o restringir
-- CREATE POLICY "Escritura solo admin" ON public.tolvas FOR ALL USING (auth.role() = 'authenticated');

-- 5. Insertar los tipos de tolva solicitados
INSERT INTO public.tolvas (nombre, descripcion, precio_base)
VALUES 
    ('Tolva de Volteo 30m3', 'Tolva estándar de 30 metros cúbicos', 0),
    ('Tolva de Volteo 40m3', 'Tolva de 40 metros cúbicos', 0),
    ('Tolva de Volteo 50m3', 'Tolva de gran capacidad de 50 metros cúbicos', 0),
    ('Tolva Granelera', 'Especializada para granos y semillas', 0),
    ('Tolva Presurizada', 'Para materiales que requieren descarga neumática (cemento, cal, etc.)', 0);

-- Nota: Los precios base se han inicializado en 0. Se deberán actualizar desde el panel administrativo.
