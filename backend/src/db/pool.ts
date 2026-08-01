import pg from 'pg';

let pool: pg.Pool | null = null;

/**
 * Lazily creates the pool on first use rather than at import time, so
 * running the weather-only routes in dev doesn't require Postgres to be
 * configured. Auth and saved-location routes call this and will fail
 * clearly if DATABASE_URL is missing.
 */
export function getPool(): pg.Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required — see .env.example');
  }

  pool = new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected Postgres pool error:', err);
  });

  return pool;
}
