import { pool } from "../../configs/db";

function generatePaperSlug(
  journalAcronym: string,
  doi: string | null,
  year: number,
  issueIndex: number,
  paperIndex: number,
): string {
  const acronym = journalAcronym.toLowerCase().replace(/[^a-z0-9]/g, "");
  const doiPrefix = doi ? doi.split("/")[0].replace(/\./g, "-") : "10-00000";
  return `${doiPrefix}-${acronym}-${year}-${issueIndex}-${paperIndex}`;
}

export const getPaperForPublish = async (ownerId: string) => {
  const result = await pool.query(
    `
    SELECT
      p.id AS "paperId",
      p.title AS "title",
      p.journal_id AS "journalId",
      p.issue_id AS "issueId",
      p.status AS "paperStatus",
      p.submitted_at AS "submittedAt",
      p.accepted_at AS "acceptedAt",
      u.username AS "authorName",
      j.title AS "journalName",
      j.acronym AS "journalAcronym",
      ji.label AS "issueLabel",
      ae.username AS "aeName",
      pv.file_url AS "fileUrl",
      pv.file_type AS "fileType",
      COALESCE(
        json_agg(DISTINCT rv.username) FILTER (WHERE rv.id IS NOT NULL),
        '[]'
      ) AS "reviewerNames",
      pub.doi AS "doi"
    FROM papers p
    JOIN users u ON u.id = p.author_id
    JOIN journals j ON j.id = p.journal_id
    LEFT JOIN journal_issues ji ON ji.id = p.issue_id
    LEFT JOIN editor_assignments ea_join
      ON ea_join.paper_id = p.id
      AND ea_join.status NOT IN ('reassigned', 'rejected', 'completed')
    LEFT JOIN users ae ON ae.id = ea_join.sub_editor_id
    LEFT JOIN review_assignments ra ON ra.paper_id = p.id
    LEFT JOIN users rv ON rv.id = ra.reviewer_id
    LEFT JOIN paper_versions pv ON pv.id = p.current_version_id
    LEFT JOIN publications pub ON pub.paper_id = p.id
    WHERE j.owner_id = $1
      AND p.status IN ('accepted', 'awaiting_payment', 'payment_review', 'ready_for_publication', 'published')
    GROUP BY
      p.id, u.username, j.title, j.acronym, ji.label,
      ae.username, pv.file_url, pv.file_type, pub.doi
    ORDER BY p.accepted_at DESC NULLS LAST, p.submitted_at DESC NULLS LAST
    `,
    [ownerId],
  );

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

    // Legacy article_index (keep for backward compat)
    const serialRes = await client.query(
      `SELECT COUNT(*)::int + 1 AS serial
       FROM publications
       WHERE issue_id = $1`,
      [issueId],
    );
    const serial = serialRes.rows[0].serial.toString().padStart(2, "0");
    const articleIndex = `${acronym}-${year}-${issueId.slice(0, 8)}-${serial}`;

    // New: paper_index = sequential position within this issue
    const paperIndexRes = await client.query(
      `SELECT COALESCE(MAX(paper_index), 0) + 1 AS next_index
       FROM publications WHERE issue_id = $1`,
      [issueId],
    );
    const paperIndex = paperIndexRes.rows[0].next_index as number;

    // New: issue_index = journal_issues.article_index (sequential per journal)
    const issueRes = await client.query(
      `SELECT article_index AS issue_index FROM journal_issues WHERE id = $1`,
      [issueId],
    );
    const issueIndex = (issueRes.rows[0]?.issue_index as number) ?? 1;

    const urlSlug = generatePaperSlug(acronym, doi, year, issueIndex, paperIndex);

    const publication = await client.query(
      `INSERT INTO publications
       (paper_id, published_by, published_at, issue_id, article_index, doi, paper_index, url_slug)
       VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7)
       ON CONFLICT (paper_id)
       DO UPDATE SET
         published_by = $2,
         published_at = NOW(),
         issue_id = $3,
         article_index = $4,
         doi = $5,
         paper_index = $6,
         url_slug = $7
       RETURNING *`,
      [paperId, editorId, issueId, articleIndex, doi, paperIndex, urlSlug],
    );

    await client.query(
      `UPDATE papers
       SET status = 'published', updated_at = NOW()
       WHERE id = $1`,
      [paperId],
    );

    await client.query(
      `INSERT INTO paper_status_log (paper_id, status, changed_by, note)
       VALUES ($1, 'published', $2, 'Paper published')`,
      [paperId, editorId],
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
