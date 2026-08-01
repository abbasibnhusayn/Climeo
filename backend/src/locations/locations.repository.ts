import { getPool } from '../db/pool.js';

export interface SavedLocationRecord {
  id: string;
  userId: string;
  label: string;
  latitude: number;
  longitude: number;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

const SELECT_COLUMNS = `
  id, user_id AS "userId", label, latitude, longitude,
  is_primary AS "isPrimary", sort_order AS "sortOrder", created_at AS "createdAt"
`;

export async function listLocations(userId: string): Promise<SavedLocationRecord[]> {
  const { rows } = await getPool().query(
    `SELECT ${SELECT_COLUMNS} FROM saved_locations
     WHERE user_id = $1
     ORDER BY is_primary DESC, sort_order ASC, created_at ASC`,
    [userId],
  );
  return rows;
}

export async function createLocation(
  userId: string,
  input: { label: string; latitude: number; longitude: number; isPrimary?: boolean },
): Promise<SavedLocationRecord> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (input.isPrimary) {
      // Only one primary location per user — clear any existing one first
      // (cheaper and simpler than relying solely on the partial unique
      // index to reject the insert).
      await client.query(
        'UPDATE saved_locations SET is_primary = false WHERE user_id = $1 AND is_primary = true',
        [userId],
      );
    }

    const { rows } = await client.query(
      `INSERT INTO saved_locations (user_id, label, latitude, longitude, is_primary)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${SELECT_COLUMNS}`,
      [userId, input.label, input.latitude, input.longitude, input.isPrimary ?? false],
    );

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteLocation(userId: string, locationId: string): Promise<boolean> {
  const { rowCount } = await getPool().query(
    'DELETE FROM saved_locations WHERE id = $1 AND user_id = $2',
    [locationId, userId],
  );
  return (rowCount ?? 0) > 0;
}
