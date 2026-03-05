-- Create table for Carga Mix equipment
CREATE TABLE IF NOT EXISTS equipos_cargamix (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    servicio TEXT NOT NULL,
    largo TEXT,
    ancho TEXT,
    peso_reglamentario TEXT,
    sobrepeso TEXT,
    alto TEXT,
    modalidad TEXT DEFAULT 'SENCILLO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert data from the image
INSERT INTO equipos_cargamix (servicio, largo, ancho, peso_reglamentario, sobrepeso, alto, modalidad) VALUES
('Cama Baja 3 ejes', '12m', '2.60 m', '35 tons', '50 tons', '1 m', 'SENCILLO'),
('Cama Baja 4 ejes extendible', '12m', '2.60 m', '35 tons', '50 tons', '1 m', 'SENCILLO'),
('Low Boy 3 ejes', '6.5 m', '3.2 m', '0', '60 tons', '60 cm', 'SENCILLO'),
('Low Boy 4 ejes', '8m', '3.20 m', '0', '90 tons', '87 cm', 'SENCILLO'),
('Low Boy cuello desmontable 3 ejes', '6.5 m', '3.20 m', '0', '60 tons', '60cm', 'SENCILLO'),
('Low Boy cuello desmontable 4 ejes', '8 m', '3.20 m', '0', '100 tons', '60cm', 'SENCILLO'),
('Low Boy cuello desmontable 4 ejes extendible', '8 a 12 m', '3.20 m', '0', '100 tons', '60 cm', 'SENCILLO'),
('Cama baja con rampa hidraulica', '12m', '2.60 m', '0', '30 tons', '1.1 m', 'SENCILLO'),
('Modular 7 ejes direccionales', NULL, NULL, NULL, NULL, NULL, 'SENCILLO'),
('Modular 10 lineas direccionales', NULL, NULL, NULL, NULL, NULL, 'SENCILLO'),
('Plataforma extendible', '16 a 24 m', '2.44 m', '24 tons', '50 tons', NULL, 'SENCILLO'),
('Plataforma extendible con eje direccional', '18 a 44 m', '2.44 m', '24 tons', '50 tons', NULL, 'SENCILLO');
