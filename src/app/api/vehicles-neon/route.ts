import { NextResponse } from 'next/server';
import pool from '@/lib/postgres';
import { VEHICLE_SPECS } from '@/lib/vehiclesData';

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not set');
    }
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM equipos_transporte');
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.warn('Error fetching vehicles from Neon, falling back to static data:', error.message);
    
    // Fallback to static data if DB is not available
    // Map VEHICLE_SPECS to match the DB schema expected by the frontend
    const fallbackData = VEHICLE_SPECS.map(v => ({
      id: v.id,
      servicio: v.name,
      largo: v.largo,
      ancho: v.ancho,
      peso_reglamentario: v.pesoMax,
      sobrepeso: v.sobrepesoMax,
      alto: v.alto,
      notas: 'Static fallback data'
    }));

    return NextResponse.json(fallbackData);
  }
}
