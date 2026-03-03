-- Script para crear la tabla de historial de cotizaciones

CREATE TABLE IF NOT EXISTS public.cotizaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    folio TEXT NOT NULL,
    cliente_nombre TEXT,
    empresa_nombre TEXT,
    fecha_expedicion DATE,
    fecha_vigencia DATE,
    origen TEXT,
    destino TEXT,
    monto_total NUMERIC,
    divisa TEXT DEFAULT 'MXN',
    estado TEXT DEFAULT 'pendiente', -- pendiente, aprobada, rechazada
    items JSONB, -- Guardar los detalles de la carga como JSON
    emitente TEXT, -- Email o nombre del usuario que creó la cotización
    tipo_servicio TEXT, -- Tipo de equipo/servicio
    detalles_adicionales JSONB -- Para guardar tiempoCarga, precioTolva, etc.
);

-- Habilitar RLS
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (ajustar según necesidades reales de auth)
-- Permitir lectura a todos (o solo autenticados)
CREATE POLICY "Lectura cotizaciones" ON public.cotizaciones FOR SELECT USING (true);

-- Permitir inserción a autenticados (o todos para pruebas)
CREATE POLICY "Insertar cotizaciones" ON public.cotizaciones FOR INSERT WITH CHECK (true);

-- Permitir actualización
CREATE POLICY "Actualizar cotizaciones" ON public.cotizaciones FOR UPDATE USING (true);
