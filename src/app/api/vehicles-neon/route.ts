import { NextResponse } from 'next/server';
import pool from '@/lib/postgres';

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM equipos_transporte');
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error fetching vehicles from Neon:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
