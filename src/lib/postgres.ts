import { Pool } from 'pg';

let pool: Pool;

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL environment variable is missing. Database features will not work.');
}

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || '',
    ssl: true,
  });
} else {
  // Use a global variable to preserve the pool across module reloads
  // caused by HMR (Hot Module Replacement).
  if (!(global as any).postgresPool) {
    (global as any).postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL || '',
      ssl: true,
      max: 20, // Set max pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
    });
  }
  pool = (global as any).postgresPool;
}

export default pool;
