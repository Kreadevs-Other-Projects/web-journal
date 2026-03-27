import { pool } from "../../configs/db";

export const getSubEditorPapers = async (subEditorId: string) => {
  const result = await pool.query(
    `
    SELECT
      p.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pv.id,
            'file_url', pv.file_url,
            'version_label', pv.version_label,
            'version_number', pv.version_number,
            'created_at', pv.created_at
          )
          ORDER BY pv.version_number DESC
        ) FILTER (WHERE pv.id IS NOT NULL),
        '[]'
      ) AS versions
    FROM papers p
    JOIN editor_assignments ea
      ON ea.paper_id = p.id
    LEFT JOIN paper_versions pv
      ON pv.paper_id = p.id
    WHERE
      ea.sub_editor_id = $1
      AND ea.status NOT IN ('reassigned', 'rejected', 'completed')
      AND p.status IN (
        'assigned_to_sub_editor',
        'under_review',
        'pending_revision',
        'resubmitted',
        'reviewed'
      )
    GROUP BY p.id
    ORDER BY p.created_at DESC
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

    await client.query(
      `
      UPDATE papers
      SET status = 'under_review'
      WHERE id = $1
      `,
      [paperId],
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


export const getReviewsForPaper = async (paperId: string) => {
  const result = await pool.query(
    `SELECT ra.id as assignment_id, ra.status as assignment_status,
            r.decision, r.comments, r.signed_at,
            ra.submitted_at
     FROM review_assignments ra
     LEFT JOIN reviews r ON r.review_assignment_id = ra.id
     WHERE ra.paper_id = $1 AND ra.status = 'submitted'
     ORDER BY ra.submitted_at DESC`,
    [paperId],
  );
  return result.rows;
};

export const subEditorDecision = async (
  paperId: string,
  subEditorId: string,
  action: "approve" | "revision" | "reject",
  comments?: string,
) => {
  const statusMap = {
    approve: "sub_editor_approved",
    revision: "pending_revision",
    reject: "rejected",
  };
  const newStatus = statusMap[action];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get current version id for audit record
    const paperRes = await client.query(
      `SELECT current_version_id FROM papers WHERE id = $1`,
      [paperId],
    );
    const currentVersionId = paperRes.rows[0]?.current_version_id ?? null;

    // Update paper status
    const result = await client.query(
      `UPDATE papers SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [newStatus, paperId],
    );

    // Insert into sub_editor_decisions
    await client.query(
      `INSERT INTO sub_editor_decisions (paper_id, sub_editor_id, decision, comments, paper_version_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [paperId, subEditorId, action, comments ?? null, currentVersionId],
    );

    // Insert into paper_status_log
    await client.query(
      `INSERT INTO paper_status_log (paper_id, status, changed_by, note)
       VALUES ($1, $2, $3, $4)`,
      [paperId, newStatus, subEditorId, comments ?? `Sub editor decision: ${action}`],
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// ---- Reviewer Requests ----

export const createReviewerRequest = async (data: {
  paper_id: string;
  sub_editor_id: string;
  suggested_name: string;
  suggested_email: string;
  keywords?: string[];
  degrees?: string[];
}) => {
  const result = await pool.query(
    `INSERT INTO reviewer_requests
       (paper_id, sub_editor_id, suggested_name, suggested_email, keywords, degrees)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.paper_id, data.sub_editor_id, data.suggested_name, data.suggested_email,
     data.keywords || [], data.degrees || []],
  );
  return result.rows[0];
};

export const getPendingReviewerRequestsForCE = async (chiefEditorId: string) => {
  const result = await pool.query(
    `SELECT rr.*, p.title as paper_title, u.username as sub_editor_name,
            j.title as journal_title
     FROM reviewer_requests rr
     JOIN papers p ON p.id = rr.paper_id
     JOIN journals j ON j.id = p.journal_id
     JOIN users u ON u.id = rr.sub_editor_id
     WHERE j.chief_editor_id = $1 AND rr.status = 'pending'
     ORDER BY rr.created_at DESC`,
    [chiefEditorId],
  );
  return result.rows;
};

export const reviewReviewerRequest = async (
  request_id: string,
  status: "approved" | "rejected",
  reviewed_by: string,
) => {
  const result = await pool.query(
    `UPDATE reviewer_requests
     SET status = $1, reviewed_by = $2, reviewed_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, reviewed_by, request_id],
  );
  return result.rows[0];
};
