import { pool } from "../../configs/db";

export const approveJournalRepo = async (
  journalId: string,
  issueId: string,
) => {
  // PAYMENT_DISABLED: Removed payment/invoice check per client instruction (Mar 2026)
  const result = await pool.query(
    `
    UPDATE journal_issues
    SET status = 'open', updated_at = NOW()
    WHERE id = $1 AND journal_id = $2
    RETURNING id
    `,
    [issueId, journalId],
  );

  if (!result.rows.length) {
    throw new Error("Issue not found for this journal");
  }
};

export const activateUserRepo = async (userId: string) => {
  await pool.query(
    `UPDATE users
     SET status = 'active'
     WHERE id = $1`,
    [userId],
  );
};

export const getPublisherJournals = async (publisherId: string) => {
  const result = await pool.query(
    `
    SELECT
      j.*,

      -- chief editor user
      json_build_object(
        'id', ce.id,
        'name', ce.username,
        'email', ce.email,
        'created_at', ce.created_at
      ) AS chief_editor,

      -- owner user
      json_build_object(
        'id', o.id,
        'name', o.username,
        'email', o.email,
        'created_at', o.created_at
      ) AS owner,

      -- journal issues array
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', ji.id,
            'year', ji.year,
            'volume', ji.volume,
            'issue', ji.issue,
            'label', ji.label,
            'issueStatus', ji.status,
            'published_at', ji.published_at,
            'updated_at', ji.updated_at
          )
        ) FILTER (WHERE ji.id IS NOT NULL),
        '[]'
      ) AS issues

    FROM journals j
    JOIN users ce ON ce.id = j.chief_editor_id
    JOIN users o ON o.id = j.owner_id
    LEFT JOIN journal_issues ji ON ji.journal_id = j.id

    WHERE j.owner_id = $1

    GROUP BY j.id, ce.id, o.id
    ORDER BY j.created_at DESC
  `,
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

export const createJournalPayment = async ({
  journalId,
  ownerId,
  issueId,
  amount,
  currency,
  status,
}: {
  journalId: string;
  ownerId: string;
  issueId?: string | null;
  amount: number;
  currency?: string;
  status?: "pending" | "success" | "failed";
}) => {
  const res = await pool.query(
    `
    INSERT INTO journal_payments (journal_id, owner_id, issue_id, amount, currency, status, payment_type)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      journalId,
      ownerId,
      issueId || null,
      amount,
      currency || "PKR",
      status || "pending",
      "first_time",
    ],
  );
  return res.rows[0];
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

export const approvePaperPaymentRepo = async (paperId: string) => {
  const check = await pool.query(
    `SELECT id FROM paper_payments WHERE paper_id = $1`,
    [paperId],
  );

  if (check.rowCount === 0) {
    throw new Error("Send invoice first");
  }

  const result = await pool.query(
    `
    UPDATE paper_payments
    SET status   = 'paid',
        paid_at = NOW(),
        updated_at = NOW()
    WHERE paper_id = $1
    RETURNING *
  `,
    [paperId],
  );

  return result.rows[0];
};

export const getPaymentsByJournal = async () => {
  const result = await pool.query(
    `SELECT *
     FROM journal_payments
     ORDER BY created_at ASC`,
  );
  return result.rows;
};

export const getPaymentById = async (id: string) => {
  const { rows } = await pool.query(
    `SELECT id, journal_id FROM journal_payments WHERE id = $1`,
    [id],
  );

  return rows[0];
};

export const updatePaymentStatus = async (id: string, status: string) => {
  await pool.query(
    `UPDATE journal_payments SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, id],
  );
};

export const updateJournalStatus = async (
  journalId: string,
  status: string,
) => {
  await pool.query(
    `UPDATE journals SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, journalId],
  );
};
