import { pool } from "../configs/db";

export const getChiefEditorJournals = async (chiefEditorId: string) => {
  const result = await pool.query(
    `
    SELECT
      j.*,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', ji.id,
            'year', ji.year,
            'volume', ji.volume,
            'issue', ji.issue,
            'label', ji.label,
            'publishedAt', ji.published_at,
            'updatedAt', ji.updated_at
          )
        ) FILTER (WHERE ji.id IS NOT NULL),
        '[]'
      ) AS issues
    FROM journals j
    LEFT JOIN journal_issues ji
      ON ji.journal_id = j.id
    WHERE j.chief_editor_id = $1
    GROUP BY j.id
    ORDER BY j.created_at DESC
    `,
    [chiefEditorId],
  );

  return result.rows;
};

export const getPapersByJournalId = async (journalId: string) => {
  const result = await pool.query(
    `SELECT 
    p.id,
    p.title,
    p.status,
    p.journal_id,
    p.created_at,
    pv.id AS version_id,
    pv.version_number,
    pv.file_url,
    pv.created_at AS version_created_at
    FROM papers p
    LEFT JOIN paper_versions pv
    ON pv.paper_id = p.id
    WHERE p.journal_id = $1
    ORDER BY p.created_at DESC, pv.version_number DESC`,
    [journalId],
  );

  return result.rows;
};

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

export const getAllPapers = async (chiefEditorId: string) => {
  const result = await pool.query(
    `
    SELECT p.*
    FROM papers p
    JOIN journals j ON j.id = p.journal_id
    WHERE j.chief_editor_id = $1
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
      ON CONFLICT (paper_id)
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
     ON CONFLICT (paper_id) 
     DO UPDATE SET 
       decision = EXCLUDED.decision,
       decision_note = EXCLUDED.decision_note,
       decided_by = EXCLUDED.decided_by,
       decided_at = NOW()
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
    JOIN journals j
      ON j.id = p.journal_id
    JOIN paper_versions pv
      ON pv.id = p.current_version_id
    JOIN reviews r
      ON r.review_assignment_id = ra.id

    WHERE 
      j.chief_editor_id = $1
      AND ra.status = 'submitted'

    ORDER BY ra.submitted_at DESC
    `,
    [chiefEditorId],
  );

  return result.rows;
};
