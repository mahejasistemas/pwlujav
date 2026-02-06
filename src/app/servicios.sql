CREATE TABLE equipos_transporte (
    id                  SERIAL PRIMARY KEY,
    servicio            VARCHAR(100) NOT NULL,
    largo               VARCHAR(50),
    ancho               VARCHAR(20),
    peso_reglamentario  DECIMAL(10,2),
    sobrepeso           DECIMAL(10,2),
    alto                VARCHAR(20),
    notas               VARCHAR(255)
)

INSERT INTO equipos_transporte 
(servicio, largo, ancho, peso_reglamentario, sobrepeso, alto, notas) VALUES

-- Plataformas estándar
('Plataforma 20 ft ejes',          '6 m',       '2.44 m',  24.00,  27.00,  NULL,     NULL),
('Plataforma 40 ft',               '12 m',      '2.44 m',  24.00,  35.00,  '2.5 m',  NULL),
('Plataforma 53 ft',               '16 m',      '2.44 m',  24.00,  27.00,  '2.5 m',  NULL),

-- Rabones
('Rabon plataforma 20 ft',         '6.5 m',     '2.44 m',   3.50,   9.00,  '2.5 m',  NULL),
('Rabon plataforma 30 ft',         '9 m',       '2.44 m',   3.50,  11.00,  '2.5 m',  NULL),
('Rabon porta contenedor',         '6 m',       '2.44 m',   3.50,   9.00,  '2.5 m',  NULL),
('Rabon plataforma hidráulica',    '6.5 m',     '2.60 m',   3.50,  11.00,  '2.80 m', NULL),
('Rabon grua hiab 5 tons',         '6.5 m',     '2.44 m',   3.50,   9.00,  '2.5 m',  'grúa hiab 5 tons'),

-- Porta contenedores y cajas secas
('Porta contenedor 20 ft',         '6 m',       '2.44 m',  24.00,  30.00,  '2.90 m', NULL),
('Porta contenedor 40 ft',         '12 m',      '2.44 m',  24.00,  30.00,  '2.90 m', NULL),
('Caja seca 53 ft',                '16 m',      '2.5 m',   24.00,  27.00,  '2.5 m',  NULL),

-- Equipos para cargas sobredimensionadas / sobregiradas
('Cama Baja 3 ejes',               '12 m',      '2.60 m',  35.00,  50.00,  '1 m',    NULL),
('Cama Baja 4 ejes extensible',    '12 m',      '2.60 m',  35.00,  50.00,  '1 m',    'extensible'),
('Low Boy 3 ejes',                 '6.5 m',     '3.2 m',    0.00,  60.00,  '60 cm',  NULL),
('Low Boy 4 ejes',                 '8 m',       '3.20 m',   0.00,  90.00,  '87 cm',  NULL),
('Low Boy cuello desmontable 3 ejes', '6.5 m',  '3.20 m',   0.00,  60.00,  '60 cm',  'cuello desmontable'),
('Low Boy cuello desmontable 4 ejes', '8 m',    '3.20 m',   0.00, 100.00,  '60 cm',  'cuello desmontable'),
('Low Boy cuello desmontable 4 ejes extensible', '8 a 12 m', '3.20 m', 0.00, 100.00, '60 cm', 'extensible + cuello desmontable'),
('Cama baja con rampa hidráulica', '12 m',      '2.60 m',   0.00,  30.00,  '1.1 m',  'rampa hidráulica'),
('Modular 7 ejes direccionales',   NULL,        NULL,       0.00,  30.00,  '1.1 m',  NULL),
('Modular 10 líneas direccionales',NULL,        NULL,       NULL,   NULL,   NULL,     NULL),
('Plataforma extensible',          '16 a 24 m', '2.44 m',  24.00,  50.00,  NULL,     'extensible'),
('Plataforma extensible con eje direccional', '18 a 44 m', '2.44 m', 24.00, 50.00, NULL, 'extensible + direccional');