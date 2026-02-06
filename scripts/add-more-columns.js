const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

async function update() {
  try {
    console.log('Connecting to Neon DB...');
    const client = await pool.connect();
    try {
      console.log('Adding detailed vehicle columns...');
      await client.query(`
        ALTER TABLE tarifas 
        ADD COLUMN IF NOT EXISTS rabon DECIMAL(10, 2),
        ADD COLUMN IF NOT EXISTS sencillo DECIMAL(10, 2),
        ADD COLUMN IF NOT EXISTS sencillo_sobrepeso DECIMAL(10, 2),
        ADD COLUMN IF NOT EXISTS "full" DECIMAL(10, 2),
        ADD COLUMN IF NOT EXISTS full_sobrepeso DECIMAL(10, 2);
      `);
      console.log('Columns added successfully!');
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

update();
