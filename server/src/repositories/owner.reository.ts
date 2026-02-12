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

export const getAllChiefEditors = async () => {
  const result = await pool.query(
    `SELECT id, username, role, status, created_at
     FROM users
     WHERE role = 'chief_editor' AND deleted_at IS NULL
     ORDER BY created_at DESC`,
  );
  return result.rows;
};

export const createChiefEditor = async (
  username: string,
  email: string,
  hashedPassword: string,
) => {
  const result = await pool.query(
    `
    INSERT INTO users (username, email, password, role, status)
    VALUES ($1, $2, $3, 'chief_editor', 'pending')
    RETURNING id, username, email, role, status, created_at
    `,
    [username, email, hashedPassword],
  );

  return result.rows[0];
};
