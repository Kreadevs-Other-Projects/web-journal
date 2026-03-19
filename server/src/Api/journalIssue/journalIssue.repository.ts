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

// ---- Issue Requests ----

export const createIssueRequest = async (data: {
  journal_id: string;
  requested_by: string;
  label: string;
  volume?: number;
  issue_no?: number;
  year?: number;
}) => {
  const result = await pool.query(
    `INSERT INTO issue_requests (journal_id, requested_by, label, volume, issue_no, year)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.journal_id, data.requested_by, data.label, data.volume ?? null, data.issue_no ?? null, data.year ?? null],
  );
  return result.rows[0];
};

export const getIssueRequestsForJournal = async (journal_id: string) => {
  const result = await pool.query(
    `SELECT ir.*, u.username as requested_by_name
     FROM issue_requests ir
     JOIN users u ON u.id = ir.requested_by
     WHERE ir.journal_id = $1
     ORDER BY ir.created_at DESC`,
    [journal_id],
  );
  return result.rows;
};

export const getPendingIssueRequestsForPublisher = async (publisher_id: string) => {
  const result = await pool.query(
    `SELECT ir.*, j.title as journal_title, u.username as requested_by_name
     FROM issue_requests ir
     JOIN journals j ON j.id = ir.journal_id
     JOIN users u ON u.id = ir.requested_by
     WHERE j.owner_id = $1 AND ir.status = 'pending'
     ORDER BY ir.created_at DESC`,
    [publisher_id],
  );
  return result.rows;
};

export const reviewIssueRequest = async (
  request_id: string,
  status: "approved" | "rejected",
  reviewed_by: string,
) => {
  const result = await pool.query(
    `UPDATE issue_requests
     SET status = $1, reviewed_by = $2, reviewed_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, reviewed_by, request_id],
  );
  return result.rows[0];
};

export const getJournalIssuesByManagerJournals = async (user_id: string) => {
  const result = await pool.query(
    `SELECT ji.*, j.title as journal_title,
            COUNT(p.id)::int as article_count
     FROM journal_issues ji
     JOIN journals j ON j.id = ji.journal_id
     JOIN user_roles ur ON ur.journal_id = ji.journal_id AND ur.user_id = $1 AND ur.role = 'journal_manager'
     LEFT JOIN papers p ON p.issue_id = ji.id
     GROUP BY ji.id, j.title
     ORDER BY ji.created_at DESC`,
    [user_id],
  );
  return result.rows;
};
