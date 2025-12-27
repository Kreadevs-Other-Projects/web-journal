import { pool } from "../configs/db";

export const findUserByEmail = async (email: string) => {
  const result = await pool.query("SELECT * FROM users WHERE emai = $1", [
    email,
  ]);
  return result.rows[0];
};
