import { pool } from "../../configs/db";

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
            'number', ji.article_index,
            'status', ji.status,
            'createdAt', ji.created_at,
            'publishedAt', ji.published_at,
            'updatedAt', ji.updated_at
          )
        ) FILTER (WHERE ji.id IS NOT NULL),
        '[]'
      ) AS issues
    FROM journals j
    LEFT JOIN journal_issues ji
      ON ji.journal_id = j.id
      AND ji.status != 'pending'
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
    SELECT
      p.*,
      u.username AS author_name,
      j.title AS journal_name,
      ji.label AS issue_label,
      ed.decision AS editor_decision,
      ae.id AS current_ae_id,
      ae.username AS current_ae_name,
      ae.email AS current_ae_email
    FROM papers p
    JOIN journals j ON j.id = p.journal_id
    LEFT JOIN users u ON u.id = p.author_id
    LEFT JOIN journal_issues ji ON ji.id = p.issue_id
    LEFT JOIN editor_decisions ed ON ed.paper_id = p.id
    LEFT JOIN editor_assignments ea_active ON ea_active.paper_id = p.id
      AND ea_active.status NOT IN ('reassigned', 'rejected', 'completed')
    LEFT JOIN users ae ON ae.id = ea_active.sub_editor_id
    WHERE j.chief_editor_id = $1
    ORDER BY p.created_at DESC
    `,
    [chiefEditorId],
  );

  return result.rows;
};

export const findSubEditors = async (journalId?: string, paperId?: string) => {
  const result = await pool.query(
    `
    SELECT DISTINCT
      u.id,
      u.username,
      u.email,
      up.degrees,
      up.keywords,
      up.profile_pic_url,
      (
        SELECT COUNT(*)::int
        FROM editor_assignments ea
        JOIN papers p ON p.id = ea.paper_id
        WHERE ea.sub_editor_id = u.id
          AND p.status NOT IN ('accepted', 'rejected', 'published')
      ) AS active_assignments
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE (u.role = 'sub_editor' OR u.id IN (
      SELECT ur.user_id FROM user_roles ur
      WHERE ur.role = 'sub_editor' AND ur.is_active = true
        ${journalId ? "AND ur.journal_id = $1" : ""}
    ))
      AND u.status = 'active'
      AND u.deleted_at IS NULL
    ORDER BY u.username ASC
    `,
    journalId ? [journalId] : [],
  );

  return result.rows;
};

export const findReviewers = async (journalId?: string, paperId?: string) => {
  const result = await pool.query(
    `
    SELECT DISTINCT
      u.id,
      u.username,
      u.email,
      up.degrees,
      up.keywords,
      up.profile_pic_url,
      (
        SELECT COUNT(*)::int
        FROM review_assignments ra
        JOIN papers p ON p.id = ra.paper_id
        WHERE ra.reviewer_id = u.id
          AND ra.status = 'assigned'
          AND p.status NOT IN ('accepted', 'rejected', 'published')
      ) AS active_assignments
    FROM users u
    LEFT JOIN user_profiles up ON up.user_id = u.id
    WHERE (u.role = 'reviewer' OR u.id IN (
      SELECT ur.user_id FROM user_roles ur
      WHERE ur.role = 'reviewer' AND ur.is_active = true
        ${journalId ? "AND ur.journal_id = $1" : ""}
    ))
      AND u.status = 'active'
      AND u.deleted_at IS NULL
    ORDER BY u.username ASC
    `,
    journalId ? [journalId] : [],
  );

  return result.rows;
};

export const assignSubEditor = async (
  paperId: string,
  subEditorId: string,
  assignedBy: string,
) => {
  const statusCheck = await pool.query(
    "SELECT status FROM papers WHERE id = $1",
    [paperId],
  );
  if (statusCheck.rows[0]?.status === "published") {
    throw new Error("Cannot change the status of a published paper.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Deactivate any existing active assignment before inserting a new one
    await client.query(
      `UPDATE editor_assignments
       SET status = 'reassigned', completed_at = NOW()
       WHERE paper_id = $1
         AND status NOT IN ('reassigned', 'rejected', 'completed')`,
      [paperId],
    );

    const assignmentResult = await client.query(
      `INSERT INTO editor_assignments
         (paper_id, sub_editor_id, assigned_by, assigned_at, status)
       VALUES ($1, $2, $3, NOW(), 'pending')
       RETURNING *`,
      [paperId, subEditorId, assignedBy],
    );

    await client.query(
      `UPDATE papers SET status = 'assigned_to_sub_editor' WHERE id = $1`,
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
      u.username AS reviewer_name,
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
    JOIN editor_assignments ea
      ON p.id = ea.paper_id
    JOIN users u
      ON u.id = ra.reviewer_id

    WHERE 
      j.chief_editor_id = $1
      AND ra.status = 'submitted'
      AND ea.status = 'accepted'

    ORDER BY ra.submitted_at DESC
    `,
    [chiefEditorId],
  );

  return result.rows;
};

export const getPapersByIssueRepo = async (issueId: string) => {
  const issueResult = await pool.query(
    `SELECT journal_id FROM journal_issues WHERE id = $1`,
    [issueId],
  );

  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const journalId = issueResult.rows[0].journal_id;
  const result = await pool.query(
    `SELECT p.*, 
            u.username as author_name,
            u.email as author_email
     FROM papers p
     LEFT JOIN users u ON p.author_id = u.id
     WHERE p.journal_id = $1
       AND (p.issue_id = $2 OR p.issue_id IS NULL)
     ORDER BY p.submitted_at DESC`,
    [journalId, issueId],
  );

  return result.rows;
};

export const assignPaperToIssueRepo = async (
  paperId: string,
  issueId: string,
) => {
  const result = await pool.query(
    `UPDATE papers
     SET issue_id = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [issueId, paperId],
  );

  return result.rows[0];
};

export const updateIssueStatusRepo = async (
  issueId: string,
  status: "open" | "closed",
) => {
  const result = await pool.query(
    `UPDATE journal_issues
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, issueId],
  );

  return result.rows[0];
};

export const getIssueByIdRepo = async (issueId: string) => {
  const result = await pool.query(
    `SELECT * FROM journal_issues WHERE id = $1`,
    [issueId],
  );
  return result.rows[0];
};

export const getPaperByIdRepo = async (paperId: string) => {
  const result = await pool.query(`SELECT * FROM papers WHERE id = $1`, [
    paperId,
  ]);
  return result.rows[0];
};

export const getPaperDecisionHistoryRepo = async (paperId: string) => {
  const result = await pool.query(
    `SELECT 'reviewer' AS role_type, r.decision, r.comments, r.reviewed_at AS decided_at,
            u.username, pv.version_number
     FROM reviews r
     JOIN review_assignments ra ON ra.id = r.review_assignment_id
     JOIN users u ON u.id = ra.reviewer_id
     LEFT JOIN paper_versions pv ON pv.id = r.paper_version_id
     WHERE ra.paper_id = $1

     UNION ALL

     SELECT 'sub_editor' AS role_type, sed.decision, sed.comments, sed.decided_at,
            u.username, pv.version_number
     FROM sub_editor_decisions sed
     JOIN users u ON u.id = sed.sub_editor_id
     LEFT JOIN paper_versions pv ON pv.id = sed.paper_version_id
     WHERE sed.paper_id = $1

     UNION ALL

     SELECT 'chief_editor' AS role_type, ed.decision::text, ed.decision_note AS comments, ed.decided_at,
            u.username, NULL::int AS version_number
     FROM editor_decisions ed
     JOIN users u ON u.id = ed.decided_by
     WHERE ed.paper_id = $1

     ORDER BY decided_at DESC`,
    [paperId],
  );
  return result.rows;
};

export const getJournalDetailsRepo = async (journalId: string, chiefEditorId: string) => {
  const journalRes = await pool.query(
    `SELECT * FROM journals WHERE id = $1 AND chief_editor_id = $2`,
    [journalId, chiefEditorId],
  );
  if (!journalRes.rows.length) return null;

  const issuesRes = await pool.query(
    `SELECT
      ji.*,
      COUNT(p.id)::int AS paper_count
    FROM journal_issues ji
    LEFT JOIN papers p ON p.issue_id = ji.id
    WHERE ji.journal_id = $1
    GROUP BY ji.id
    ORDER BY ji.created_at DESC`,
    [journalId],
  );

  const unassignedRes = await pool.query(
    `SELECT
      p.id, p.title, p.status, p.submitted_at, p.updated_at,
      u.username AS author_name
    FROM papers p
    LEFT JOIN users u ON u.id = p.author_id
    WHERE p.journal_id = $1 AND p.issue_id IS NULL
    ORDER BY p.submitted_at DESC`,
    [journalId],
  );

  return {
    journal: journalRes.rows[0],
    issues: issuesRes.rows,
    unassigned_papers: unassignedRes.rows,
  };
};
