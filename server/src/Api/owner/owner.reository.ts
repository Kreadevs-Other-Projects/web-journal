import { pool } from "../../configs/db";

export const getAllPublishers = async () => {
  const result = await pool.query(
    `SELECT id, username, role, status, created_at
     FROM users
     WHERE role = 'publisher' AND deleted_at IS NULL
     ORDER BY created_at DESC`,
  );
  return result.rows;
};

export const getAllChiefEditors = async () => {
  const result = await pool.query(
    `SELECT id, username, role, status, created_at
     FROM users
     WHERE role = 'chief_editor' AND deleted_at IS NULL
     ORDER BY created_at DESC`,
  );
  return result.rows;
};

export const createChiefEditor = async (
  username: string,
  email: string,
  hashedPassword: string,
) => {
  const result = await pool.query(
    `
    INSERT INTO users (username, email, password, role, status)
    VALUES ($1, $2, $3, 'chief_editor', 'pending')
    RETURNING id, username, email, role, status, created_at
    `,
    [username, email, hashedPassword],
  );

  return result.rows[0];
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
      "renewal",
    ],
  );
  return res.rows[0];
};

export const getJournalIssuesTotalAmount = async (journalId: string) => {
  const { rows } = await pool.query(
    `
    SELECT 
      j.id AS journal_id,
      j.title AS journal_name,
      j.owner_id,
      u.username,
      u.email,
      j.expiry_at,
      COALESCE(SUM(ji.amount), 0) AS total_amount
    FROM journals j
    JOIN users u ON u.id = j.owner_id
    LEFT JOIN journal_issues ji ON ji.journal_id = j.id
    WHERE j.id = $1
    GROUP BY j.id, u.id
    `,
    [journalId],
  );

  return rows[0];
};

export const getPendingJournalPayment = async (journalId: string) => {
  const result = await pool.query(
    `SELECT *
     FROM journal_payments
     WHERE journal_id = $1
       AND status = 'pending'
     ORDER BY created_at`,
    [journalId],
  );

  return result.rows;
};

export const getPendingJournal = async (journalId: string) => {
  const result = await pool.query(
    `SELECT *
     FROM journal_payments
     WHERE journal_id = $1
       AND status = 'pending'
     ORDER BY created_at`,
    [journalId],
  );

  return result.rows[0];
};

export const updateReceiptImage = async (
  paymentId: string,
  imagePath: string,
) => {
  const { rows } = await pool.query(
    `UPDATE journal_payments
     SET transaction_pic = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [imagePath, paymentId],
  );
  return rows[0];
};
