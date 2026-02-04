import { pool } from "../configs/db";

export const getSubEditorPapers = async (subEditorId: string) => {
  const result = await pool.query(
    `
    SELECT DISTINCT ON (p.id)
      p.*,
      pv.id            AS version_id,
      pv.file_url,
      pv.version_label,
      pv.version_number,
      pv.created_at    AS version_created_at
    FROM papers p
    JOIN editor_assignments ea
      ON ea.paper_id = p.id
    LEFT JOIN paper_versions pv
      ON pv.paper_id = p.id
    WHERE
      ea.sub_editor_id = $1
      AND p.status IN (
        'assigned_to_editor',
        'under_review',
        'pending_revision',
        'resubmitted'
      )
    ORDER BY p.id, pv.created_at DESC
    `,
    [subEditorId],
  );

  return result.rows;
};

export const findReviewer = async () => {
  const result = await pool.query(
    `
    SELECT id, username, email
    FROM users
    WHERE role = 'reviewer'
      AND status = 'active'
    ORDER BY username ASC
    `,
  );

  return result.rows;
};

export const assignReviewer = async (
  paperId: string,
  reviewerId: string,
  assignedBy: string,
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      INSERT INTO review_assignments
        (paper_id, reviewer_id, assigned_by, assigned_at, status)
      VALUES ($1, $2, $3, NOW(), 'assigned')
      ON CONFLICT (paper_id, reviewer_id)
      DO UPDATE
        SET status = 'assigned'
      `,
      [paperId, reviewerId, assignedBy],
    );

    await client.query("COMMIT");

    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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
