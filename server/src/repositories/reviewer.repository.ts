import { pool } from "../configs/db";

export const getReviewerProfileByUserId = async (userId: string) => {
  const result = await pool.query(
    `SELECT * FROM reviewer_profiles WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
};

export const createReviewerProfile = async (userId: string) => {
  const result = await pool.query(
    `INSERT INTO reviewer_profiles (user_id)
     VALUES ($1)
     RETURNING *`,
    [userId]
  );
  return result.rows[0];
};

export const updateReviewerProfile = async (
  userId: string,
  certification: string,
  qualifications: string[]
) => {
  const result = await pool.query(
    `UPDATE reviewer_profiles
     SET certification = $1,
         qualifications = $2
     WHERE user_id = $3
     RETURNING *`,
    [certification, qualifications, userId]
  );
  return result.rows[0];
};

export const softDeleteReviewerProfile = async (userId: string) => {
  await pool.query(
    `UPDATE reviewer_profiles
     SET is_deleted = TRUE
     WHERE user_id = $1`,
    [userId]
  );
};
