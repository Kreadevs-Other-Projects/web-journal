import { pool } from "../configs/db";

export const getEditorJournals = async (editorId: string) => {
  const result = await pool.query(
    `SELECT j.*
     FROM journals j
     JOIN journal_members jm ON jm.journal_id = j.id
     WHERE jm.user_id = $1 AND jm.role='chief_editor'
     ORDER BY j.created_at DESC`,
    [editorId],
  );
  return result.rows;
};

export const getJournalPapers = async (journalId: string) => {
  const result = await pool.query(
    `SELECT *
     FROM papers
     WHERE journal_id = $1
     ORDER BY created_at DESC`,
    [journalId],
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
