// Climeo — developed by Halool.

import { getPool } from '../db/pool.js';

export interface DeviceTokenInput {
  userId: string | null;
  token: string;
  platform: 'android' | 'ios' | 'macos' | 'windows' | 'web';
  latitude: number | null;
  longitude: number | null;
}

export async function registerToken(input: DeviceTokenInput): Promise<void> {
  await getPool().query(
    `INSERT INTO device_tokens (user_id, token, platform, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (token) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       platform = EXCLUDED.platform,
       latitude = COALESCE(EXCLUDED.latitude, device_tokens.latitude),
       longitude = COALESCE(EXCLUDED.longitude, device_tokens.longitude),
       last_seen_at = now()`,
    [input.userId, input.token, input.platform, input.latitude, input.longitude],
  );
}

export async function removeToken(token: string): Promise<void> {
  await getPool().query('DELETE FROM device_tokens WHERE token = $1', [token]);
}

/** A token paired with the location its alerts should be checked against. */
export interface AlertCheckTarget {
  token: string;
  latitude: number;
  longitude: number;
}

/**
 * Resolves every token's alert-check location: a logged-in user's primary
 * saved location takes priority; otherwise the device's own last-known
 * coordinates (set at registration time). Tokens with neither are
 * excluded — there's nothing to check them against.
 */
export async function listAlertCheckTargets(): Promise<AlertCheckTarget[]> {
  const { rows } = await getPool().query<AlertCheckTarget>(
    `SELECT dt.token,
            COALESCE(primary_loc.latitude, dt.latitude) AS latitude,
            COALESCE(primary_loc.longitude, dt.longitude) AS longitude
     FROM device_tokens dt
     LEFT JOIN saved_locations primary_loc
       ON primary_loc.user_id = dt.user_id AND primary_loc.is_primary = true
     WHERE COALESCE(primary_loc.latitude, dt.latitude) IS NOT NULL
       AND COALESCE(primary_loc.longitude, dt.longitude) IS NOT NULL`,
  );
  return rows;
}

export async function removeInvalidTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;
  await getPool().query('DELETE FROM device_tokens WHERE token = ANY($1::text[])', [tokens]);
}
