import { pool } from "../../configs/db";

export const getAuthorJournals = async () => {
  const res = await pool.query(
    `
    SELECT DISTINCT ON (j.id)
      j.*,
      (
        SELECT GREATEST(0, 99 - COUNT(p.id)::int)
        FROM journal_issues ji2
        LEFT JOIN papers p ON p.issue_id = ji2.id
        WHERE ji2.journal_id = j.id AND ji2.status = 'open'
        GROUP BY ji2.id
        ORDER BY ji2.created_at ASC
        LIMIT 1
      ) AS available_slots
    FROM journals j
    JOIN journal_issues ji ON ji.journal_id = j.id
    WHERE ji.status = 'open'
    ORDER BY j.id, j.created_at DESC;
    `,
  );
  return res.rows;
};

export const getAuthorJournalIssues = async (journal_id: string) => {
  const result = await pool.query(
    `
    SELECT *
    FROM journal_issues
    WHERE journal_id = $1
    AND status = 'open'
    ORDER BY year DESC, volume DESC, issue DESC
    `,
    [journal_id],
  );

  return result.rows;
};

export const getJournalAccessMeta = async (journalId: string) => {
  const res = await pool.query(
    `SELECT id, owner_id, status FROM journals WHERE id = $1`,
    [journalId],
  );

  return res.rows[0] || null;
};
