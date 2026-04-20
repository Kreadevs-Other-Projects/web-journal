import { pool } from "../../configs/db";
import bcrypt from "bcrypt";

export const getReviewerPapers = async (reviewerId: string) => {
  const result = await pool.query(
    `
    SELECT 
      p.id AS paper_id,
      p.title,
      p.status AS paper_status,
      p.abstract,
      p.category,
      p.current_version_id,
      p.created_at,
      p.updated_at,
      p.submitted_at AS submitted_date,
      p.keywords,

      pv.id AS paper_version_id,
      pv.version_number,
      pv.file_url,
      pv.created_at AS version_created_at,

      ra.status AS assignment_status,
      ra.assigned_at,

      p.ce_override,

      r.decision AS review_decision,
      r.comments,
      r.signed_at AS review_submitted_at,

      j.title AS journal_name,
      j.acronym AS journal_acronym,
      i.label AS issue_label,

      ae_user.username AS ae_name

    FROM review_assignments ra
    JOIN papers p ON p.id = ra.paper_id
    LEFT JOIN paper_versions pv ON pv.id = p.current_version_id
    LEFT JOIN reviews r ON ra.id = r.review_assignment_id
    LEFT JOIN journal_issues i ON i.id = p.issue_id
    LEFT JOIN journals j ON j.id = i.journal_id
    LEFT JOIN editor_assignments ea ON ea.paper_id = p.id
      AND ea.status NOT IN ('reassigned', 'rejected', 'completed')
    LEFT JOIN users ae_user ON ae_user.id = ea.sub_editor_id
    WHERE ra.reviewer_id = $1
    ORDER BY pv.created_at DESC
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
  password?: string,
  signatureFilename?: string,
  confidentialComments?: string,
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

    let signatureUrl: string | null = null;

    if (decision === "accepted" || decision === "rejected") {
      if (!password || !signatureFilename) {
        throw new Error("Password and signature are required");
      }

      const userRes = await client.query(
        `SELECT password FROM users WHERE id = $1`,
        [reviewerId],
      );

      if (!userRes.rowCount) {
        throw new Error("User not found");
      }

      const hashedPassword = userRes.rows[0].password;

      const isMatch = await bcrypt.compare(password, hashedPassword);

      if (!isMatch) {
        throw new Error("Invalid password");
      }

      signatureUrl = `/uploads/${signatureFilename}`;
    }

    const review = await client.query(
      `
      INSERT INTO reviews
        (review_assignment_id, decision, comments, confidential_comments, signature_url, signed_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (review_assignment_id)
      DO UPDATE SET
        decision              = EXCLUDED.decision,
        comments              = EXCLUDED.comments,
        confidential_comments = EXCLUDED.confidential_comments,
        signature_url         = EXCLUDED.signature_url,
        signed_at             = NOW()
      RETURNING *
      `,
      [assignmentId, decision, comments, confidentialComments ?? null, signatureUrl],
    );

    await client.query(
      `UPDATE review_assignments
       SET status = 'submitted', submitted_at = NOW()
       WHERE id = $1`,
      [assignmentId],
    );

    await client.query(
      `UPDATE papers
       SET status = 'reviewed', updated_at = NOW()
       WHERE id = $1
         AND status NOT IN ('pending_revision', 'rejected', 'accepted', 'published', 'sub_editor_approved')`,
      [paperId],
    );

    await client.query(
      `INSERT INTO paper_status_log (paper_id, status, changed_by)
       VALUES ($1, 'reviewed', $2)
       ON CONFLICT DO NOTHING`,
      [paperId, reviewerId],
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
