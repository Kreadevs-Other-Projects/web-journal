import { pool } from "../configs/db";

export const findChiefEditors = async () => {
  const result = await pool.query(
    `
    SELECT id, username, email
    FROM users
    WHERE role = 'chief_editor'
      AND status = 'active'
    ORDER BY username ASC
    `,
  );

  return result.rows;
};

export const getJournalPapers = async (chiefEditorId: string) => {
  const result = await pool.query(
    `
    SELECT p.*
    FROM papers p
    WHERE p.chief_editor_id = $1
      AND NOT EXISTS (
        SELECT 1
        FROM editor_decisions ed
        WHERE ed.paper_id = p.id
      )
    ORDER BY p.created_at DESC
    `,
    [chiefEditorId],
  );

  return result.rows;
};

export const findSubEditors = async () => {
  const result = await pool.query(
    `
    SELECT id, username, email
    FROM users
    WHERE role = 'sub_editor'
      AND status = 'active'
    ORDER BY username ASC
    `,
  );

  return result.rows;
};

export const assignSubEditor = async (
  paperId: string,
  subEditorId: string,
  assignedBy: string,
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const assignmentResult = await client.query(
      `
      INSERT INTO editor_assignments 
        (paper_id, sub_editor_id, assigned_by, assigned_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (paper_id, sub_editor_id)
      DO NOTHING
      RETURNING *
      `,
      [paperId, subEditorId, assignedBy],
    );

    await client.query(
      `
      UPDATE papers
      SET status = 'assigned_to_editor'
      WHERE id = $1
      `,
      [paperId],
    );

    await client.query("COMMIT");

    return assignmentResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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

export const hasSubmittedReviews = async (paperId: string) => {
  const result = await pool.query(
    `SELECT COUNT(*) 
     FROM review_assignments
     WHERE paper_id = $1 AND status = 'submitted'`,
    [paperId],
  );

  return Number(result.rows[0].count) > 0;
};

export const createEditorDecision = async (
  paperId: string,
  editorId: string,
  decision: string,
  note: string,
) => {
  const result = await pool.query(
    `INSERT INTO editor_decisions
      (paper_id, decided_by, decision, decision_note)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [paperId, editorId, decision, note],
  );

  return result.rows[0];
};

export const updatePaperStatus = async (paperId: string, status: string) => {
  const result = await pool.query(
    `UPDATE papers
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, paperId],
  );
  return result.rows[0];
};

export const getSubmittedReviewsByChiefEditor = async (
  chiefEditorId: string,
) => {
  const result = await pool.query(
    `
    SELECT 
      p.id AS paper_id,
      p.title AS title,
      p.status AS paper_status,
      
      pv.id AS paper_version_id,
      pv.version_number,
      pv.file_url,
      pv.created_at AS version_created_at,

      ra.status AS assignment_status,
      ra.reviewer_id,
      ra.submitted_at,

      r.id AS review_id,
      r.decision,
      r.comments

    FROM review_assignments ra
    JOIN papers p
      ON p.id = ra.paper_id
    JOIN paper_versions pv
      ON pv.id = p.current_version_id
    JOIN reviews r
      ON ra.id = r.review_assignment_id
    WHERE 
      p.chief_editor_id = $1
      AND ra.status = 'submitted'
    ORDER BY ra.submitted_at DESC
    `,
    [chiefEditorId],
  );

  return result.rows;
};
