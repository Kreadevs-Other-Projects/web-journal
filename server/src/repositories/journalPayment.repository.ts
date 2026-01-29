import { pool } from "../configs/db";

export const createJournalPayment = async ({
  journal_id,
  issue_id,
  owner_id,
  amount,
}: {
  journal_id: string;
  issue_id: string;
  owner_id: string;
  amount: number;
}) => {
  const result = await pool.query(
    `
    INSERT INTO journal_payments
    (journal_id, issue_id, owner_id, amount, status)
    VALUES ($1,$2,$3,$4,'pending')
    RETURNING *
    `,
    [journal_id, issue_id, owner_id, amount],
  );

  return result.rows[0];
};
