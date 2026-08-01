import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

let client: Redis | null = null;
let connectionFailed = false;

function getClient(): Redis | null {
  if (connectionFailed) return null;
  if (!client) {
    client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // don't hang the process retrying forever
      lazyConnect: true,
    });
    client.on('error', () => {
      // Cache is an optimization, not a dependency — swallow errors and
      // fall back to always-fetch-from-provider behavior.
      connectionFailed = true;
    });
  }
  return client;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const c = getClient();
  if (!c) return null;
  try {
    if (c.status === 'wait') await c.connect();
    const raw = await c.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const c = getClient();
  if (!c) return;
  try {
    if (c.status === 'wait') await c.connect();
    await c.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // best-effort cache write; ignore failures
  }
}

/**
 * Forecast data doesn't need re-fetching on every request. Open-Meteo
 * updates roughly hourly, so a 10-minute cache balances freshness against
 * load — tune per-provider once paid providers with rate limits are added.
 */
export const FORECAST_CACHE_TTL_SECONDS = 600;
