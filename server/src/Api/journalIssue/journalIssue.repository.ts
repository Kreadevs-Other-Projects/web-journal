import { pool } from "../../configs/db";

export type JournalIssueData = {
  year: number;
  volume?: number;
  issue?: number;
  label: string;
  published_at?: string;
};

export const createJournalIssue = async (
  journal_id: string,
  data: JournalIssueData,
) => {
  const { year, volume, issue, label, published_at } = data;

  const indexResult = await pool.query(
    `SELECT COALESCE(MAX(article_index), 0) + 1 AS next_index
     FROM journal_issues
     WHERE journal_id = $1`,
    [journal_id],
  );

  const article_index = indexResult.rows[0].next_index;

  const result = await pool.query(
    `
    INSERT INTO journal_issues
      (journal_id, year, volume, issue, label, published_at, article_index)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      journal_id,
      year,
      volume || null,
      issue || null,
      label,
      published_at || null,
      article_index,
    ],
  );

  return result.rows[0];
};

export const getJournalIssues = async (journal_id: string) => {
  const result = await pool.query(
    `
    SELECT *
    FROM journal_issues
    WHERE journal_id = $1
    ORDER BY year DESC, volume DESC, issue DESC
    `,
    [journal_id],
  );

  return result.rows;
};

export const updateJournalIssue = async (issue_id: string, data: any) => {
  const fields = Object.keys(data)
    .map((key, i) => `${key} = $${i + 2}`)
    .join(", ");

  const values = Object.values(data);

  const result = await pool.query(
    `
    UPDATE journal_issues
    SET ${fields}, updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [issue_id, ...values],
  );

  return result.rows[0];
};

export const deleteJournalIssue = async (issue_id: string) => {
  await pool.query(`DELETE FROM journal_issues WHERE id = $1`, [issue_id]);
};
