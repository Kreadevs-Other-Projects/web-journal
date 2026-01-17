import { pool } from "../configs/db";

export const assignReviewer = async (
  paper_id: string,
  reviewer_id: string,
  assigned_by: string,
) => {
  const result = await pool.query(
    `
    INSERT INTO review_assignments
    (paper_id, reviewer_id, assigned_by)
    VALUES ($1,$2,$3)
    RETURNING *
    `,
    [paper_id, reviewer_id, assigned_by],
  );

  return result.rows[0];
};

export const updateReviewAssignmentStatus = async (assignment_id: string) => {
  await pool.query(
    `
    UPDATE review_assignments
    SET status = 'submitted', submitted_at = NOW()
    WHERE id = $1
    `,
  );
};
