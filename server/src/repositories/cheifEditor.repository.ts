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
    SELECT *
    FROM papers
    WHERE chief_editor_id = $1
    ORDER BY created_at DESC
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
  const result = await pool.query(
    `INSERT INTO editor_assignments (paper_id, sub_editor_id, assigned_by, assigned_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (paper_id, sub_editor_id)
     DO NOTHING
     RETURNING *`,
    [paperId, subEditorId, assignedBy],
  );
  return result.rows[0];
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
  const result = await pool.query(
    `
    INSERT INTO review_assignments
      (paper_id, reviewer_id, assigned_by, assigned_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (paper_id, reviewer_id)
    DO NOTHING
    RETURNING *
    `,
    [paperId, reviewerId, assignedBy],
  );

  return result.rows[0];
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
