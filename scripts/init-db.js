const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Simple .env parser since we might not have dotenv
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    const lines = envFile.split('\n');
    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  } catch (e) {
    console.log('Could not load .env.local, assuming env vars are set');
  }
}

loadEnv();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

async function init() {
  try {
    console.log('Connecting to Neon DB...');
    const client = await pool.connect();
    try {
      console.log('Creating table tarifas...');
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
      console.log('Table created successfully!');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

init();
