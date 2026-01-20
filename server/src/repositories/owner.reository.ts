import { pool } from "../configs/db";

export const getAllPublishers = async () => {
  const result = await pool.query(
    `SELECT id, username, role, status, created_at
     FROM users
     WHERE role = 'publisher' AND deleted_at IS NULL
     ORDER BY created_at DESC`,
  );
  return result.rows;
};
