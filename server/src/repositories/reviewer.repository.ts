import { pool } from "../configs/db";

export const getReviewerPapers = async (reviewerId: string) => {
  const result = await pool.query(
    `SELECT p.*, ra.status as assignment_status
     FROM papers p
     JOIN review_assignments ra ON ra.paper_id = p.id
     WHERE ra.reviewer_id = $1`,
    [reviewerId],
  );
  return result.rows;
};

export const submitReview = async (
  paperId: string,
  reviewerId: string,
  decision: string,
  comments: string,
) => {
  const raResult = await pool.query(
    `SELECT id FROM review_assignments WHERE paper_id=$1 AND reviewer_id=$2`,
    [paperId, reviewerId],
  );

  if (raResult.rows.length === 0) throw new Error("No assignment found");

  const reviewAssignmentId = raResult.rows[0].id;

  const reviewResult = await pool.query(
    `INSERT INTO reviews (review_assignment_id, decision, comments, signed_at)
     VALUES ($1,$2,$3,NOW())
     RETURNING *`,
    [reviewAssignmentId, decision, comments],
  );

  await pool.query(
    `UPDATE review_assignments SET status='submitted', submitted_at=NOW() 
     WHERE id=$1`,
    [reviewAssignmentId],
  );

  return reviewResult.rows[0];
};
