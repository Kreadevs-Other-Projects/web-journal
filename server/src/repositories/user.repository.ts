import { pool } from "../configs/db";

export const findUserByEmail = async (email: string) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
};

export const createUser = async (userData: {
  email: string;
  password: string;
  username: string;
}) => {
  const result = await pool.query(
    "INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING id, email, username",
    [userData.email, userData.password, userData.username]
  );
  return result.rows[0];
};
