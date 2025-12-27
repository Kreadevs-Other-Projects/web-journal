import { pool } from "../configs/db";

export const saveRefreshToken = async (
  userId: string,
  token: string,
  expires_at: Date
) => {
  const result = await pool.query(
    "INSERT INTO refresh_token (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id",
    [userId, token, expires_at]
  );
  return result.rows[0]?.id;
};

export const findRefreshToken = async (token: string) => {
  const result = await pool.query(
    "SELECT * FROM refresh_token WHERE token = $1",
    [token]
  );
  return result.rows[0];
};
