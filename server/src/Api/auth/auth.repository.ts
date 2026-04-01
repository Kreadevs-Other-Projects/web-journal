import { pool } from "../../configs/db";

export const saveRefreshToken = async (
  userId: string,
  token: string,
  expires_at: Date,
) => {
  const result = await pool.query(
    "INSERT INTO refresh_token (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id",
    [userId, token, expires_at],
  );
  return result.rows[0]?.id;
};

export const findRefreshToken = async (token: string) => {
  const result = await pool.query(
    "SELECT * FROM refresh_token WHERE token = $1",
    [token],
  );
  return result.rows[0];
};

export const deleteRefreshToken = async (token: string) => {
  const result = await pool.query(
    "DELETE FROM refresh_token WHERE token = $1 RETURNING id",
    [token],
  );
  return result.rows[0]?.id;
};

export const deleteAllUserRefreshTokens = async (userId: string) => {
  await pool.query("DELETE FROM refresh_token WHERE user_id = $1", [userId]);
};

export const getUserRoles = async (userId: string) => {
  const result = await pool.query(
    `SELECT ur.role, ur.journal_id, j.title AS journal_name
     FROM user_roles ur
     LEFT JOIN journals j ON j.id = ur.journal_id
     WHERE ur.user_id = $1 AND ur.is_active = TRUE`,
    [userId],
  );
  return result.rows as { role: string; journal_id: string | null; journal_name: string | null }[];
};

export const upsertAuthorRole = async (userId: string) => {
  await pool.query(
    `INSERT INTO user_roles (user_id, role, journal_id, granted_by, is_active)
     SELECT $1, 'author', NULL, $1, true
     WHERE NOT EXISTS (
       SELECT 1 FROM user_roles
       WHERE user_id = $1 AND role = 'author' AND journal_id IS NULL
     )`,
    [userId],
  );
};

export const insertUserRole = async (
  userId: string,
  role: string,
  journalId: string | null,
  grantedBy: string | null,
) => {
  const result = await pool.query(
    `INSERT INTO user_roles (user_id, role, journal_id, granted_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, role, journal_id) DO NOTHING
     RETURNING id`,
    [userId, role, journalId, grantedBy],
  );
  return result.rows[0]?.id;
};
