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
    p.ce_override,
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
  p.id,
  p.title,
  p.abstract,
  p.status,
  p.submitted_at,
  p.published_at,
  p.created_at,
  p.updated_at,
  p.ce_override,
  author.username AS author_name,
  j.title AS journal_name,
  j.id AS journal_id,
  ji.label AS issue_label,
  pv.file_url,
  pv.file_type,
  pv.version_number AS current_version_number,
  ae_user.id AS current_ae_id,
  ae_user.username AS current_ae_name,
  ae_user.email AS current_ae_email,
  ea.status AS ae_assignment_status,
  sd.decision AS ae_decision,
  sd.decided_at AS ae_decided_at,
  COALESCE(
    json_agg(
      json_build_object(
        'id', rv.id,
        'name', rv.username,
        'status', ra.status,
        'decision', r.decision
      )
    ) FILTER (WHERE rv.id IS NOT NULL),
    '[]'
  ) AS reviewers
FROM papers p
JOIN users author ON author.id = p.author_id
JOIN journals j ON j.id = p.journal_id
LEFT JOIN journal_issues ji ON ji.id = p.issue_id
LEFT JOIN paper_versions pv ON pv.id = p.current_version_id
LEFT JOIN editor_assignments ea ON ea.paper_id = p.id
  AND ea.status NOT IN ('reassigned', 'rejected', 'completed')
LEFT JOIN users ae_user ON ae_user.id = ea.sub_editor_id
LEFT JOIN LATERAL (
  SELECT decision, decided_at
  FROM sub_editor_decisions
  WHERE paper_id = p.id
    AND sub_editor_id = ea.sub_editor_id
  ORDER BY decided_at DESC
  LIMIT 1
) sd ON true
LEFT JOIN review_assignments ra ON ra.paper_id = p.id
  AND ra.status != 'reassigned'
LEFT JOIN users rv ON rv.id = ra.reviewer_id
LEFT JOIN reviews r ON r.review_assignment_id = ra.id
WHERE j.chief_editor_id = $1
  OR j.id IN (
    SELECT journal_id FROM user_roles
    WHERE user_id = $1 AND role = 'chief_editor' AND is_active = true
  )
GROUP BY
  p.id, p.title, p.abstract, p.status, p.submitted_at, p.published_at, p.created_at, p.updated_at,
  p.ce_override,
  author.username, j.title, j.id, ji.label,
  pv.file_url, pv.file_type, pv.version_number,
  ae_user.id, ae_user.username, ae_user.email,
  ea.status,
  sd.decision, sd.decided_at
ORDER BY p.submitted_at DESC NULLS LAST, p.created_at DESC
    `,
    [chiefEditorId],
  );

  return result.rows;
};

export const getStaffProfile = async (userId: string) => {
  // Profile
  const profileRes = await pool.query(
    `SELECT u.id, u.username, u.email, u.role,
            up.degrees, up.keywords, up.profile_pic_url
     FROM users u
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE u.id = $1`,
    [userId],
  );
  if (!profileRes.rows.length) return null;
  const profile = profileRes.rows[0];

  // Certifications
  const certRes = await pool.query(
    `SELECT id, file_url, file_name, file_type, uploaded_at
     FROM user_certifications
     WHERE user_id = $1
     ORDER BY uploaded_at DESC`,
    [userId],
  );

  // Papers (AE path)
  const aeRes = await pool.query(
    `SELECT
       p.id, p.title, p.status, p.submitted_at,
       j.title AS journal_name, j.acronym,
       ji.label AS issue_label,
       sd.decision AS ae_decision, sd.decided_at,
       ea.status AS assignment_status, ea.assigned_at
     FROM editor_assignments ea
     JOIN papers p ON p.id = ea.paper_id
     JOIN journals j ON j.id = p.journal_id
     LEFT JOIN journal_issues ji ON ji.id = p.issue_id
     LEFT JOIN sub_editor_decisions sd
       ON sd.paper_id = ea.paper_id AND sd.sub_editor_id = ea.sub_editor_id
     WHERE ea.sub_editor_id = $1
     ORDER BY ea.assigned_at DESC`,
    [userId],
  );

  // Papers (reviewer path)
  const rvRes = await pool.query(
    `SELECT
       p.id, p.title, p.status, p.submitted_at,
       j.title AS journal_name, j.acronym,
       ji.label AS issue_label,
       r.decision AS review_decision, r.reviewed_at,
       ra.status AS assignment_status, ra.assigned_at
     FROM review_assignments ra
     JOIN papers p ON p.id = ra.paper_id
     JOIN journals j ON j.id = p.journal_id
     LEFT JOIN journal_issues ji ON ji.id = p.issue_id
     LEFT JOIN reviews r ON r.review_assignment_id = ra.id
     WHERE ra.reviewer_id = $1
     ORDER BY ra.assigned_at DESC`,
    [userId],
  );

  return {
    ...profile,
    certifications: certRes.rows,
    ae_papers: aeRes.rows,
    review_papers: rvRes.rows,
  };
};

export const findSubEditors = async (journalId?: string, paperId?: string, ceId?: string) => {
  // When called by a CE, return only staff belonging to their journals
  if (ceId) {
    const result = await pool.query(
      `SELECT DISTINCT
        u.id, u.username, u.email,
        up.degrees, up.keywords, up.profile_pic_url,
        (
          SELECT STRING_AGG(DISTINCT j2.title, ', ')
          FROM user_roles ur2
          JOIN journals j2 ON j2.id = ur2.journal_id
          WHERE ur2.user_id = u.id AND ur2.role = 'sub_editor' AND ur2.is_active = true
            AND (
              ur2.granted_by = $1
              OR ur2.journal_id IN (
                SELECT id FROM journals WHERE chief_editor_id = $1
                UNION
                SELECT journal_id FROM user_roles
                WHERE user_id = $1 AND role = 'chief_editor' AND is_active = true
              )
            )
        ) AS journal_names,
        (
          SELECT COUNT(*)::int
          FROM editor_assignments ea
          JOIN papers p ON p.id = ea.paper_id
          WHERE ea.sub_editor_id = u.id
            AND p.status NOT IN ('accepted', 'rejected', 'published')
        ) AS active_assignments
      FROM user_roles ur
      JOIN users u ON u.id = ur.user_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE ur.role = 'sub_editor'
        AND ur.is_active = true
        AND u.status = 'active'
        AND u.deleted_at IS NULL
        AND (
          ur.granted_by = $1
          OR ur.journal_id IN (
            SELECT id FROM journals WHERE chief_editor_id = $1
            UNION
            SELECT journal_id FROM user_roles
            WHERE user_id = $1 AND role = 'chief_editor' AND is_active = true
          )
        )
      ORDER BY u.username ASC`,
      [ceId],
    );
    return result.rows;
  }

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

export const findReviewers = async (journalId?: string, paperId?: string, ceId?: string) => {
  // When called by a CE, return only staff belonging to their journals
  if (ceId) {
    const result = await pool.query(
      `SELECT DISTINCT
        u.id, u.username, u.email,
        up.degrees, up.keywords, up.profile_pic_url,
        (
          SELECT STRING_AGG(DISTINCT j2.title, ', ')
          FROM user_roles ur2
          JOIN journals j2 ON j2.id = ur2.journal_id
          WHERE ur2.user_id = u.id AND ur2.role = 'reviewer' AND ur2.is_active = true
            AND (
              ur2.granted_by = $1
              OR ur2.journal_id IN (
                SELECT id FROM journals WHERE chief_editor_id = $1
                UNION
                SELECT journal_id FROM user_roles
                WHERE user_id = $1 AND role = 'chief_editor' AND is_active = true
              )
            )
        ) AS journal_names,
        (
          SELECT COUNT(*)::int
          FROM review_assignments ra
          JOIN papers p ON p.id = ra.paper_id
          WHERE ra.reviewer_id = u.id
            AND ra.status = 'assigned'
            AND p.status NOT IN ('accepted', 'rejected', 'published')
        ) AS active_assignments
      FROM user_roles ur
      JOIN users u ON u.id = ur.user_id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE ur.role = 'reviewer'
        AND ur.is_active = true
        AND u.status = 'active'
        AND u.deleted_at IS NULL
        AND (
          ur.granted_by = $1
          OR ur.journal_id IN (
            SELECT id FROM journals WHERE chief_editor_id = $1
            UNION
            SELECT journal_id FROM user_roles
            WHERE user_id = $1 AND role = 'chief_editor' AND is_active = true
          )
        )
      ORDER BY u.username ASC`,
      [ceId],
    );
    return result.rows;
  }

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

export const getJournalStaff = async (
  journalId: string,
  role: "sub_editor" | "reviewer",
  paperId?: string,
  ceId?: string,
) => {
  const workloadSubquery =
    role === "sub_editor"
      ? `(SELECT COUNT(*)::int FROM editor_assignments ea
           WHERE ea.sub_editor_id = u.id
             AND ea.status NOT IN ('reassigned','rejected','completed'))`
      : `(SELECT COUNT(*)::int FROM review_assignments ra
           WHERE ra.reviewer_id = u.id AND ra.status = 'assigned')`;

  // Return all platform users with this role who joined via any chief editor invitation
  const params: any[] = [role];
  const keywordSubquery = paperId
    ? `(SELECT COUNT(*)::int FROM unnest(COALESCE(up.keywords, '{}')) k
         WHERE k = ANY(SELECT unnest(p.keywords) FROM papers p WHERE p.id = $2))`
    : `0`;
  if (paperId) params.push(paperId);

  const result = await pool.query(
    `SELECT DISTINCT
       u.id, u.username, u.email,
       up.degrees, up.keywords, up.profile_pic_url,
       ${keywordSubquery} AS keyword_matches,
       ${workloadSubquery} AS active_papers
     FROM user_roles ur
     JOIN users u ON u.id = ur.user_id
     LEFT JOIN user_profiles up ON up.user_id = u.id
     WHERE ur.role = $1
       AND ur.is_active = true
       AND u.status = 'active'
       AND u.deleted_at IS NULL
     ORDER BY keyword_matches DESC, active_papers ASC`,
    params,
  );

  return result.rows;
};

export const assignSubEditor = async (
  paperId: string,
  subEditorId: string,
  assignedBy: string,
) => {
  const statusCheck = await pool.query(
    "SELECT status, journal_id FROM papers WHERE id = $1",
    [paperId],
  );
  if (statusCheck.rows[0]?.status === "published") {
    throw new Error("Cannot change the status of a published paper.");
  }
  const journalId = statusCheck.rows[0]?.journal_id ?? null;

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

    // Ensure sub_editor role is tracked in user_roles for this journal
    if (journalId) {
      await client.query(
        `INSERT INTO user_roles (user_id, role, journal_id, granted_by, is_active)
         VALUES ($1, 'sub_editor', $2, $3, true)
         ON CONFLICT (user_id, role, journal_id) DO UPDATE SET is_active = true`,
        [subEditorId, journalId, assignedBy],
      );
    }

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
      se.username AS sub_editor_name,

      sed.id AS sub_editor_decision_id,
      sed.decision AS sub_editor_decision,
      sed.comments AS sub_editor_comments,
      sed.decided_at AS sub_editor_decided_at

    FROM review_assignments ra
    JOIN papers p
      ON p.id = ra.paper_id
    JOIN journals j
      ON j.id = p.journal_id
    JOIN paper_versions pv
      ON pv.id = p.current_version_id
    JOIN reviews r_exists
      ON r_exists.review_assignment_id = ra.id

    LEFT JOIN sub_editor_decisions sed
      ON sed.paper_id = p.id
      AND sed.paper_version_id = pv.id

    JOIN editor_assignments ea
      ON p.id = ea.paper_id
    JOIN users u
      ON u.id = ra.reviewer_id
    LEFT JOIN users se
      ON se.id = ea.sub_editor_id

    WHERE
      j.chief_editor_id = $1
      AND ra.status != 'reassigned'
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

export const getCEStatsRepo = async (chiefEditorId: string) => {
  const aeStats = await pool.query(
    `SELECT
       u.id AS ae_id,
       u.username AS ae_name,
       u.email AS ae_email,
       COUNT(DISTINCT ea.paper_id)::int AS total_assigned,
       COUNT(DISTINCT ea.paper_id) FILTER (WHERE ea.status NOT IN ('reassigned', 'rejected', 'completed'))::int AS pending,
       COUNT(DISTINCT ea.paper_id) FILTER (WHERE sed.decision = 'approve')::int AS approved,
       COUNT(DISTINCT ea.paper_id) FILTER (WHERE sed.decision = 'reject')::int AS rejected,
       COUNT(DISTINCT ea.paper_id) FILTER (WHERE sed.decision = 'revision')::int AS revision
     FROM editor_assignments ea
     JOIN users u ON u.id = ea.sub_editor_id
     JOIN papers p ON p.id = ea.paper_id
     JOIN journals j ON j.id = p.journal_id
     LEFT JOIN sub_editor_decisions sed ON sed.paper_id = ea.paper_id AND sed.sub_editor_id = ea.sub_editor_id
     WHERE j.chief_editor_id = $1
     GROUP BY u.id, u.username, u.email
     ORDER BY u.username ASC`,
    [chiefEditorId],
  );

  const reviewerStats = await pool.query(
    `SELECT
       u.id AS reviewer_id,
       u.username AS reviewer_name,
       u.email AS reviewer_email,
       COUNT(DISTINCT ra.paper_id)::int AS total_assigned,
       COUNT(DISTINCT ra.paper_id) FILTER (WHERE ra.status = 'assigned')::int AS pending,
       COUNT(DISTINCT ra.paper_id) FILTER (WHERE ra.status = 'submitted')::int AS completed,
       COUNT(DISTINCT ra.paper_id) FILTER (WHERE r.decision = 'accepted')::int AS accepted,
       COUNT(DISTINCT ra.paper_id) FILTER (WHERE r.decision = 'rejected')::int AS rejected,
       COUNT(DISTINCT ra.paper_id) FILTER (WHERE r.decision = 'minor_revision')::int AS minor_revision,
       COUNT(DISTINCT ra.paper_id) FILTER (WHERE r.decision = 'major_revision')::int AS major_revision
     FROM review_assignments ra
     JOIN users u ON u.id = ra.reviewer_id
     JOIN papers p ON p.id = ra.paper_id
     JOIN journals j ON j.id = p.journal_id
     LEFT JOIN reviews r ON r.review_assignment_id = ra.id
     WHERE j.chief_editor_id = $1
     GROUP BY u.id, u.username, u.email
     ORDER BY u.username ASC`,
    [chiefEditorId],
  );

  const overallStats = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE p.status = 'submitted')::int AS submitted,
       COUNT(*) FILTER (WHERE p.status IN ('under_review', 'assigned_to_sub_editor'))::int AS under_review,
       COUNT(*) FILTER (WHERE p.status IN ('accepted', 'awaiting_payment', 'payment_review', 'ready_for_publication'))::int AS accepted,
       COUNT(*) FILTER (WHERE p.status = 'rejected')::int AS rejected,
       COUNT(*) FILTER (WHERE p.status = 'published')::int AS published
     FROM papers p
     JOIN journals j ON j.id = p.journal_id
     WHERE j.chief_editor_id = $1
       OR j.id IN (SELECT journal_id FROM user_roles WHERE user_id = $1 AND role = 'chief_editor' AND is_active = true)`,
    [chiefEditorId],
  );

  return {
    ae_stats: aeStats.rows,
    reviewer_stats: reviewerStats.rows,
    overall: overallStats.rows[0],
  };
};

export const getLastReminderRepo = async (paperId: string, sentTo: string) => {
  const result = await pool.query(
    `SELECT sent_at FROM paper_reminders
     WHERE paper_id = $1 AND sent_to = $2
     ORDER BY sent_at DESC LIMIT 1`,
    [paperId, sentTo],
  );
  return result.rows[0] || null;
};

export const insertReminderRepo = async (
  paperId: string,
  sentTo: string,
  sentBy: string,
  role: string,
) => {
  await pool.query(
    `INSERT INTO paper_reminders (paper_id, sent_to, sent_by, role) VALUES ($1, $2, $3, $4)`,
    [paperId, sentTo, sentBy, role],
  );
};

export const getJournalDetailsRepo = async (
  journalId: string,
  chiefEditorId: string,
) => {
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
