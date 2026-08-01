// Climeo — developed by Halool.

import { getPool } from '../db/pool.js';

export type AgeGroup = 'child' | 'adult' | 'senior';
export type ActivityLevel = 'low' | 'moderate' | 'high';

export interface UserProfileRecord {
  userId: string;
  ageGroup: AgeGroup | null;
  hasRespiratoryCondition: boolean;
  hasCardiovascularCondition: boolean;
  outdoorActivityLevel: ActivityLevel | null;
  updatedAt: string;
}

const SELECT_COLUMNS = `
  user_id AS "userId", age_group AS "ageGroup",
  has_respiratory_condition AS "hasRespiratoryCondition",
  has_cardiovascular_condition AS "hasCardiovascularCondition",
  outdoor_activity_level AS "outdoorActivityLevel",
  updated_at AS "updatedAt"
`;

export async function getProfile(userId: string): Promise<UserProfileRecord | null> {
  const { rows } = await getPool().query(
    `SELECT ${SELECT_COLUMNS} FROM user_profiles WHERE user_id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

export interface ProfileInput {
  ageGroup?: AgeGroup | null;
  hasRespiratoryCondition?: boolean;
  hasCardiovascularCondition?: boolean;
  outdoorActivityLevel?: ActivityLevel | null;
}

export async function upsertProfile(
  userId: string,
  input: ProfileInput,
): Promise<UserProfileRecord> {
  const { rows } = await getPool().query(
    `INSERT INTO user_profiles (user_id, age_group, has_respiratory_condition, has_cardiovascular_condition, outdoor_activity_level, updated_at)
     VALUES ($1, $2, COALESCE($3, false), COALESCE($4, false), $5, now())
     ON CONFLICT (user_id) DO UPDATE SET
       age_group = EXCLUDED.age_group,
       has_respiratory_condition = EXCLUDED.has_respiratory_condition,
       has_cardiovascular_condition = EXCLUDED.has_cardiovascular_condition,
       outdoor_activity_level = EXCLUDED.outdoor_activity_level,
       updated_at = now()
     RETURNING ${SELECT_COLUMNS}`,
    [
      userId,
      input.ageGroup ?? null,
      input.hasRespiratoryCondition,
      input.hasCardiovascularCondition,
      input.outdoorActivityLevel ?? null,
    ],
  );
  return rows[0];
}
