import { pool } from "../../configs/db";

export const submitReview = async (review_assignment_id: string, data: any) => {
  const { decision, comments, signature_url } = data;

  const result = await pool.query(
    `
    INSERT INTO reviews
    (review_assignment_id, decision, comments, signature_url, signed_at)
    VALUES ($1,$2,$3,$4,NOW())
    RETURNING *
    `,
    [review_assignment_id, decision, comments, signature_url],
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
