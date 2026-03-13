import { pool } from "../../configs/db";

export const getPaperForPublish = async () => {
  const result = await pool.query(`
    SELECT 
      ea.id AS "editorAssignmentId",
      ea.status AS "editorAssignmentStatus",
      ea.assigned_at AS "editorAssignedAt",

      p.id AS "paperId",
      p.title AS "title",
      p.journal_id AS journalId,
      p.issue_id As issueId,
      p.status AS "paperStatus",

      pv.id AS "paperVersionId",
      pv.version_number AS "versionNumber",
      pv.file_url AS "fileUrl",
      pv.created_at AS "versionCreatedAt",

      ra.id AS "reviewAssignmentId",
      ra.reviewer_id AS "reviewerId",
      ra.status AS "reviewAssignmentStatus",
      ra.submitted_at AS "submittedAt",

      r.id AS "reviewId",
      r.decision AS "decision",
      r.comments AS "comments",
      r.signature_url AS "signatureUrl",
      r.signed_at AS "signedAt"

    FROM editor_assignments ea

    JOIN papers p ON p.id = ea.paper_id

    LEFT JOIN paper_versions pv ON pv.id = p.current_version_id

    LEFT JOIN review_assignments ra
      ON ra.paper_id = ea.paper_id
      AND ra.status = 'submitted'

    LEFT JOIN reviews r ON r.review_assignment_id = ra.id

    WHERE p.status IN ('accepted', 'published')

    ORDER BY ra.submitted_at DESC NULLS LAST
  `);

  return result.rows;
};

export const publishPaper = async (
  paperId: string,
  editorId: string,
  issueId: string,
  doi: string,
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const journal = await client.query(
      `SELECT j.acronym
       FROM papers p
       JOIN journals j ON j.id = p.journal_id
       WHERE p.id = $1`,
      [paperId],
    );

    const acronym = journal.rows[0]?.acronym || "JNL";
    const year = new Date().getFullYear();

    const serialRes = await client.query(
      `SELECT COUNT(*)::int + 1 AS serial
       FROM publications
       WHERE issue_id = $1`,
      [issueId],
    );

    const serial = serialRes.rows[0].serial.toString().padStart(2, "0");
    const articleIndex = `${acronym}-${year}-${issueId.slice(0, 8)}-${serial}`;

    const publication = await client.query(
      `INSERT INTO publications
       (paper_id, published_by, published_at, issue_id, article_index, doi)
       VALUES ($1, $2, NOW(), $3, $4, $5)
       ON CONFLICT (paper_id)
       DO UPDATE SET
         published_by = $2,
         published_at = NOW(),
         issue_id = $3,
         article_index = $4,
         doi = $5
       RETURNING *`,
      [paperId, editorId, issueId, articleIndex, doi],
    );

    await client.query(
      `UPDATE papers
       SET status = 'published', updated_at = NOW()
       WHERE id = $1`,
      [paperId],
    );

    await client.query("COMMIT");

    return publication.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
