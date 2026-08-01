import { getPool } from '../db/pool.js';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  createdAt: string;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const { rows } = await getPool().query(
    `SELECT id, email, password_hash AS "passwordHash", display_name AS "displayName",
            created_at AS "createdAt"
     FROM users WHERE email = $1`,
    [email.toLowerCase()],
  );
  return rows[0] ?? null;
}

export async function createUser(
  email: string,
  passwordHash: string,
  displayName?: string,
): Promise<UserRecord> {
  const { rows } = await getPool().query(
    `INSERT INTO users (email, password_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, password_hash AS "passwordHash", display_name AS "displayName",
               created_at AS "createdAt"`,
    [email.toLowerCase(), passwordHash, displayName ?? null],
  );
  return rows[0];
}

export async function getSubscriptionTier(userId: string): Promise<string | null> {
  const { rows } = await getPool().query(
    'SELECT subscription_tier FROM users WHERE id = $1',
    [userId],
  );
  return rows[0]?.subscription_tier ?? null;
}
