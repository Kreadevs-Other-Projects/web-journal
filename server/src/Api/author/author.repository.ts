import { pool } from "../../configs/db";

export const getAuthorJournals = async () => {
  const res = await pool.query(
    `
    SELECT *
    FROM journals
    WHERE status = 'active';
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
