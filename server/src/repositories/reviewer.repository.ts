import { pool } from "../configs/db";

export const getReviewerPapers = async (reviewerId: string) => {
  const result = await pool.query(
    `
    SELECT 
      p.id            AS paper_id,
      p.title         AS title,
      p.status        AS paper_status,

      pv.id           AS paper_version_id,
      pv.version_number,
      pv.file_url,
      pv.created_at   AS version_created_at,

      ra.status       AS assignment_status,

      r.decision,
      r.comments

    FROM review_assignments ra
    JOIN papers p 
      ON p.id = ra.paper_id
    JOIN paper_versions pv
      ON pv.id = p.current_version_id
    LEFT JOIN reviews r
      ON ra.id = r.review_assignment_id
    WHERE 
      ra.reviewer_id = $1
    `,
    [reviewerId],
  );

  return result.rows;
};

export const submitReviewByVersion = async (
  paperVersionId: string,
  reviewerId: string,
  decision: string,
  comments: string,
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const pv = await client.query(
      `SELECT paper_id FROM paper_versions WHERE id = $1`,
      [paperVersionId],
    );

    if (!pv.rowCount) {
      throw new Error("Paper version not found");
    }

    const paperId = pv.rows[0].paper_id;

    const ra = await client.query(
      `
      SELECT id FROM review_assignments
      WHERE paper_id = $1
        AND reviewer_id = $2
        AND status = 'assigned'
      `,
      [paperId, reviewerId],
    );

    if (!ra.rowCount) {
      throw new Error("Reviewer not assigned to this paper");
    }

    const assignmentId = ra.rows[0].id;

    const review = await client.query(
      `
      INSERT INTO reviews
      (review_assignment_id, decision, comments, signed_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
      `,
      [assignmentId, decision, comments],
    );

    await client.query(
      `
      UPDATE review_assignments
      SET status = 'submitted', submitted_at = NOW()
      WHERE id = $1
      `,
      [assignmentId],
    );

    await client.query(
      `
      UPDATE papers
      SET status = 'accepted',
          updated_at = NOW()
      WHERE id = $1
      `,
      [paperId],
    );

    await client.query("COMMIT");

    return review.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
