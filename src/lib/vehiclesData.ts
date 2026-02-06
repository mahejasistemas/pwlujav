
export interface VehicleSpec {
  id: string;
  name: string;
  largo: number; // metros
  ancho: number; // metros
  alto: number; // metros
  pesoMax: number; // toneladas
  sobrepesoMax: number; // toneladas adicionales permitidas
  volumenMax: number; // m3
  tariffType?: 'rabon' | 'sencillo' | 'full'; // To map to tariff columns
}

export const VEHICLE_SPECS: VehicleSpec[] = [
  // Plataformas estándar
  { id: 'plataforma_20_ft_ejes', name: 'Plataforma 20 ft ejes', largo: 6, ancho: 2.44, pesoMax: 24.00, sobrepesoMax: 27.00, alto: 0, volumenMax: 0, tariffType: 'sencillo' },
  { id: 'plataforma_40_ft', name: 'Plataforma 40 ft', largo: 12, ancho: 2.44, pesoMax: 24.00, sobrepesoMax: 35.00, alto: 2.5, volumenMax: 73.2, tariffType: 'sencillo' },
  { id: 'plataforma_53_ft', name: 'Plataforma 53 ft', largo: 16, ancho: 2.44, pesoMax: 24.00, sobrepesoMax: 27.00, alto: 2.5, volumenMax: 97.6, tariffType: 'sencillo' },

  // Rabones
  { id: 'rabon_plataforma_20_ft', name: 'Rabon plataforma 20 ft', largo: 6.5, ancho: 2.44, pesoMax: 3.50, sobrepesoMax: 9.00, alto: 2.5, volumenMax: 39.65, tariffType: 'rabon' },
  { id: 'rabon_plataforma_30_ft', name: 'Rabon plataforma 30 ft', largo: 9, ancho: 2.44, pesoMax: 3.50, sobrepesoMax: 11.00, alto: 2.5, volumenMax: 54.9, tariffType: 'rabon' },
  { id: 'rabon_porta_contenedor', name: 'Rabon porta contenedor', largo: 6, ancho: 2.44, pesoMax: 3.50, sobrepesoMax: 9.00, alto: 2.5, volumenMax: 36.6, tariffType: 'rabon' },
  { id: 'rabon_plataforma_hidraulica', name: 'Rabon plataforma hidráulica', largo: 6.5, ancho: 2.60, pesoMax: 3.50, sobrepesoMax: 11.00, alto: 2.80, volumenMax: 47.32, tariffType: 'rabon' },
  { id: 'rabon_grua_hiab_5_tons', name: 'Rabon grua hiab 5 tons', largo: 6.5, ancho: 2.44, pesoMax: 3.50, sobrepesoMax: 9.00, alto: 2.5, volumenMax: 39.65, tariffType: 'rabon' },

  // Porta contenedores y cajas secas
  { id: 'porta_contenedor_20_ft', name: 'Porta contenedor 20 ft', largo: 6, ancho: 2.44, pesoMax: 24.00, sobrepesoMax: 30.00, alto: 2.90, volumenMax: 42.46, tariffType: 'sencillo' },
  { id: 'porta_contenedor_40_ft', name: 'Porta contenedor 40 ft', largo: 12, ancho: 2.44, pesoMax: 24.00, sobrepesoMax: 30.00, alto: 2.90, volumenMax: 84.91, tariffType: 'sencillo' },
  { id: 'caja_seca_53_ft', name: 'Caja seca 53 ft', largo: 16, ancho: 2.5, pesoMax: 24.00, sobrepesoMax: 27.00, alto: 2.5, volumenMax: 100, tariffType: 'sencillo' },

  // Equipos para cargas sobredimensionadas / sobregiradas
  { id: 'cama_baja_3_ejes', name: 'Cama Baja 3 ejes', largo: 12, ancho: 2.60, pesoMax: 35.00, sobrepesoMax: 50.00, alto: 1, volumenMax: 31.2, tariffType: 'full' },
  { id: 'cama_baja_4_ejes_extensible', name: 'Cama Baja 4 ejes extensible', largo: 12, ancho: 2.60, pesoMax: 35.00, sobrepesoMax: 50.00, alto: 1, volumenMax: 31.2, tariffType: 'full' },
  { id: 'low_boy_3_ejes', name: 'Low Boy 3 ejes', largo: 6.5, ancho: 3.2, pesoMax: 0.00, sobrepesoMax: 60.00, alto: 0.60, volumenMax: 12.48, tariffType: 'full' },
  { id: 'low_boy_4_ejes', name: 'Low Boy 4 ejes', largo: 8, ancho: 3.20, pesoMax: 0.00, sobrepesoMax: 90.00, alto: 0.87, volumenMax: 22.27, tariffType: 'full' },
  { id: 'low_boy_cuello_desmontable_3_ejes', name: 'Low Boy cuello desmontable 3 ejes', largo: 6.5, ancho: 3.20, pesoMax: 0.00, sobrepesoMax: 60.00, alto: 0.60, volumenMax: 12.48, tariffType: 'full' },
  { id: 'low_boy_cuello_desmontable_4_ejes', name: 'Low Boy cuello desmontable 4 ejes', largo: 8, ancho: 3.20, pesoMax: 0.00, sobrepesoMax: 100.00, alto: 0.60, volumenMax: 15.36, tariffType: 'full' },
  { id: 'low_boy_cuello_desmontable_4_ejes_extensible', name: 'Low Boy cuello desmontable 4 ejes extensible', largo: 12, ancho: 3.20, pesoMax: 0.00, sobrepesoMax: 100.00, alto: 0.60, volumenMax: 23.04, tariffType: 'full' }, // Max length used
  { id: 'cama_baja_con_rampa_hidraulica', name: 'Cama baja con rampa hidráulica', largo: 12, ancho: 2.60, pesoMax: 0.00, sobrepesoMax: 30.00, alto: 1.1, volumenMax: 34.32, tariffType: 'full' },
  { id: 'modular_7_ejes_direccionales', name: 'Modular 7 ejes direccionales', largo: 0, ancho: 0, pesoMax: 0.00, sobrepesoMax: 30.00, alto: 1.1, volumenMax: 0, tariffType: 'full' },
  { id: 'modular_10_lineas_direccionales', name: 'Modular 10 líneas direccionales', largo: 0, ancho: 0, pesoMax: 0, sobrepesoMax: 0, alto: 0, volumenMax: 0, tariffType: 'full' },
  { id: 'plataforma_extensible', name: 'Plataforma extensible', largo: 24, ancho: 2.44, pesoMax: 24.00, sobrepesoMax: 50.00, alto: 0, volumenMax: 0, tariffType: 'full' }, // Max length
  { id: 'plataforma_extensible_con_eje_direccional', name: 'Plataforma extensible con eje direccional', largo: 44, ancho: 2.44, pesoMax: 24.00, sobrepesoMax: 50.00, alto: 0, volumenMax: 0, tariffType: 'full' } // Max length
];

// Helper to calculate volume if 0
VEHICLE_SPECS.forEach(v => {
  if (v.volumenMax === 0 && v.largo > 0 && v.ancho > 0 && v.alto > 0) {
    v.volumenMax = v.largo * v.ancho * v.alto;
  }
});

export function recommendVehicle(weightTons: number, volumeM3: number, l: number, w: number, h: number, customSpecs?: VehicleSpec[]): VehicleSpec | null {
  // Use custom specs if provided, otherwise default
  const specs = customSpecs && customSpecs.length > 0 ? customSpecs : VEHICLE_SPECS;

  // Filter vehicles that can handle the weight and dimensions
  const suitable = specs.filter(v => {
    // 1. Weight Check (base + overweight)
    const maxCapacity = Math.max(v.pesoMax, v.sobrepesoMax);
    // Skip invalid data (unless it's a special modular with 0 base but valid overweight)
    if (maxCapacity === 0 && v.sobrepesoMax === 0) return false;
    
    if (weightTons > maxCapacity) return false;
    
    // 2. Volume Check (only if vehicle has volume limit)
    if (v.volumenMax > 0 && volumeM3 > v.volumenMax) return false;

    // 3. Dimension Check (L, W, H)
    // Vehicle dimensions
    const vL = v.largo;
    const vW = v.ancho;
    const vH = v.alto;

    // Length & Width: Try both orientations (Standard and Rotated)
    // Case A: Standard (Item Length fits in Vehicle Length, Item Width fits in Vehicle Width)
    const fitsStandard = (l <= vL && w <= vW);
    // Case B: Rotated (Item Length fits in Vehicle Width, Item Width fits in Vehicle Length)
    const fitsRotated = (l <= vW && w <= vL);

    if (!fitsStandard && !fitsRotated) return false;

    // Height Check
    // If vehicle height is 0, we assume it's an open platform (no strict roof limit) 
    // OR we assume standard legal limit. For this logic, 0 = "fits anything reasonable"
    // If vehicle height > 0, strict check (e.g. Box / Container)
    if (vH > 0 && h > vH) return false;

    return true;
  });

  // Sort logic: Find the "Best Fit"
  // Prioritize by:
  // 1. Weight Capacity (Smallest sufficient capacity first) - saves cost
  // 2. Length (Smallest sufficient length) - compact
  suitable.sort((a, b) => {
    const capA = Math.max(a.pesoMax, a.sobrepesoMax);
    const capB = Math.max(b.pesoMax, b.sobrepesoMax);
    
    // Primary: Capacity (closer to target weight is better)
    if (Math.abs(capA - capB) > 0.5) {
      return capA - capB;
    }

    // Secondary: Volume capacity (if volume is constraint)
    if (a.volumenMax > 0 && b.volumenMax > 0) {
      return a.volumenMax - b.volumenMax;
    }

    // Tertiary: Length
    return a.largo - b.largo;
  });

  return suitable.length > 0 ? suitable[0] : null;
}
