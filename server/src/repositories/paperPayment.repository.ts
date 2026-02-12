import { pool } from "../configs/db";

export const createPaperPaymentRepo = async (
  paper_id: string,
  author_id: string,
  pages: number,
  price_per_page: number,
) => {
  const total_amount = pages * price_per_page;

  const result = await pool.query(
    `
    INSERT INTO paper_payments
    (paper_id, author_id, pages, price_per_page, total_amount)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *
    `,
    [paper_id, author_id, pages, price_per_page, total_amount],
  );

  return result.rows[0];
};

export const getPaymentByPaperIdRepo = async (paper_id: string) => {
  const result = await pool.query(
    `SELECT * FROM paper_payments WHERE paper_id=$1`,
    [paper_id],
  );

  return result.rows[0];
};

export const markPaymentPaidRepo = async (
  payment_id: string,
  transaction_ref: string,
) => {
  const result = await pool.query(
    `
    UPDATE paper_payments
    SET status='paid',
        transaction_ref=$2,
        paid_at=NOW()
    WHERE id=$1
    RETURNING *
    `,
    [payment_id, transaction_ref],
  );

  return result.rows[0];
};
