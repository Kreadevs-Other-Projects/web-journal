import { pool } from "../configs/db";

export const getSubEditorPapers = async (subEditorId: string) => {
  const result = await pool.query(
    `
    SELECT p.*
    FROM papers p
    JOIN editor_assignments ea 
      ON ea.paper_id = p.id
    WHERE 
      ea.sub_editor_id = $1
      AND p.status IN ('assigned_to_editor', 'under_review', 'pending_revision', 'resubmitted')
    `,
    [subEditorId],
  );

  return result.rows;
};

export const assignReviewer = async (
  paperId: string,
  reviewerId: string,
  assignedBy: string,
) => {
  const result = await pool.query(
    `INSERT INTO review_assignments (paper_id, reviewer_id, assigned_by, assigned_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (paper_id, reviewer_id)
     DO NOTHING
     RETURNING *`,
    [paperId, reviewerId, assignedBy],
  );
  return result.rows[0];
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
    `SELECT u.id, u.username, u.email
     FROM users u
     JOIN review_assignments ra ON ra.reviewer_id = u.id
     WHERE ra.paper_id = $1`,
    [paperId],
  );
  return result.rows;
};
