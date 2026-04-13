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
    `UPDATE review_assignments SET status = 'submitted', submitted_at = NOW() WHERE id = $1`,
    [assignment_id],
  );

  // Update the paper status to 'reviewed' so sub editor can see it needs a decision
  await pool.query(
    `UPDATE papers
     SET status = 'reviewed', updated_at = NOW()
     WHERE id = (
       SELECT paper_id FROM review_assignments WHERE id = $1
     )
     AND status NOT IN ('pending_revision', 'rejected', 'accepted', 'published')`,
    [assignment_id],
  );
};
