import { pool } from "../configs/db";

export const getEditorProfileById = async (id: string) => {
  const result = await pool.query(
    "SELECT * FROM editor_profiles WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

export const createEditorProfile = async (userId: string, type: string) => {
  const result = await pool.query(
    `INSERT INTO editor_profiles (user_id, type, expertise)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, type, []]
  );
  return result.rows[0];
};

export const updateEditorProfileStatus = async (
  id: string,
  adminId: string,
  status: "pending" | "accepted" | "rejected"
) => {
  await pool.query(
    `UPDATE editor_profiles
     SET is_approved = $1,
         approved_by = $2,
         approved_at = NOW()
     WHERE id = $3`,
    [status, adminId, id]
  );
};

export const updateEditorProfileExpertise = async (
  id: string,
  expertise: string[]
) => {
  const result = await pool.query(
    `UPDATE editor_profiles
     SET expertise = $1
     WHERE id = $2
     RETURNING *`,
    [expertise, id]
  );
  return result.rows[0];
};
