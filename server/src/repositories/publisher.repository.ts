import { pool } from "../configs/db";

export const getPublisherJournals = async (publisherId: string) => {
  const result = await pool.query(
    `SELECT *
     FROM journals
     WHERE publisher_id = $1
     ORDER BY created_at DESC`,
    [publisherId],
  );
  return result.rows;
};

export const getJournalIssues = async (journalId: string) => {
  const result = await pool.query(
    `SELECT *
     FROM journal_issues
     WHERE journal_id = $1
     ORDER BY year DESC, volume DESC, issue DESC`,
    [journalId],
  );
  return result.rows;
};

export const createJournalIssue = async (
  journalId: string,
  year: number,
  volume: number,
  issue: number,
  label: string,
) => {
  const result = await pool.query(
    `INSERT INTO journal_issues (journal_id, year, volume, issue, label)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [journalId, year, volume, issue, label],
  );
  return result.rows[0];
};

export const publishIssue = async (issueId: string) => {
  const result = await pool.query(
    `UPDATE journal_issues
     SET published_at=NOW(), updated_at=NOW()
     WHERE id = $1
     RETURNING *`,
    [issueId],
  );
  return result.rows[0];
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

export const getPapersByIssueIdRepo = async (issueId: string) => {
  const result = await pool.query(
    `
    SELECT 
      p.id,
      p.title,
      p.abstract,
      p.status,
      p.created_at,
      u.id AS author_id,
      u.username AS author_name
    FROM papers p
    JOIN users u ON u.id = p.author_id
    WHERE p.issue_id = $1
    AND p.status = 'accepted'
    ORDER BY p.created_at DESC
    `,
    [issueId],
  );

  return result.rows;
};

export const publishPaper = async (paperId: string, publisherId: string) => {
  const result = await pool.query(
    `INSERT INTO publications (paper_id, published_by, published_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (paper_id)
     DO UPDATE SET published_by = $2, published_at = NOW()
     RETURNING *`,
    [paperId, publisherId],
  );

  await pool.query(
    `UPDATE papers SET status='published', updated_at=NOW() WHERE id = $1`,
    [paperId],
  );

  return result.rows[0];
};
