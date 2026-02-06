import { NextResponse } from 'next/server';
import pool from '@/lib/postgres';

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS tarifas (
          id SERIAL PRIMARY KEY,
          origen TEXT NOT NULL,
          destino TEXT NOT NULL,
          precio DECIMAL(10, 2),
          precio_sobrepeso DECIMAL(10, 2),
          tipo_unidad TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      return NextResponse.json({ message: 'Database initialized successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json({ error: 'Failed to initialize database', details: error }, { status: 500 });
  }
}
