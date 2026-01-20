import { pool } from "../configs/db";

export const getSubEditorPapers = async (subEditorId: string) => {
  const result = await pool.query(
    `SELECT p.*
     FROM papers p
     JOIN editor_assignments ea ON ea.paper_id = p.id
     WHERE ea.sub_editor_id = $1`,
    [subEditorId],
  );
  return result.rows;
};

export const updatePaperStatusSubEditor = async (
  paperId: string,
  status: string,
) => {
  const result = await pool.query(
    `UPDATE papers SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
    [status, paperId],
  );
  return result.rows[0];
};

export const getAssignedReviewers = async (paperId: string) => {
  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email
     FROM users u
     JOIN review_assignments ra ON ra.reviewer_id = u.id
     WHERE ra.paper_id = $1`,
    [paperId],
  );
  return result.rows;
};
