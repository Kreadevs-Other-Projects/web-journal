import { pool } from "../configs/db";

export const findUserByEmail = async (email: string) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL",
    [email]
  );
  return result.rows[0];
};

export const findUserById = async (id: string) => {
  const res = await pool.query(
    `SELECT id, email, username, role, created_at
     FROM users
     WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  return res.rows[0];
};

export const createUser = async (userData: {
  email: string;
  password: string;
  username: string;
  role: string;
}) => {
  const result = await pool.query(
    "INSERT INTO users (email, password, username, role) VALUES ($1, $2, $3, $4) RETURNING id",
    [userData.email, userData.password, userData.username, userData.role]
  );
  return result.rows[0];
};

export const updateUser = async (
  userId: string,
  data: { username?: string; email?: string }
) => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.username !== undefined) {
    updates.push(`username = $${paramIndex}`);
    values.push(data.username);
    paramIndex++;
  }

  if (data.email !== undefined) {
    updates.push(`email = $${paramIndex}`);
    values.push(data.email);
    paramIndex++;
  }

  if (updates.length === 0) {
    return null;
  }

  updates.push(`updated_at = NOW()`);
  values.push(userId);

  const query = `
    UPDATE users 
    SET ${updates.join(", ")} 
    WHERE id = $${paramIndex} AND deleted_at IS NULL
    RETURNING id, email, username, updated_at
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const softDeleteUser = async (userId: string) => {
  const timestamp = new Date().toISOString();

  const result = await pool.query(
    `UPDATE users 
     SET 
       email = CONCAT('deleted_', email),
       username = CONCAT('deleted_', username),
       deleted_at = $1
     WHERE id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [timestamp, userId]
  );
  return result.rows[0];
};
