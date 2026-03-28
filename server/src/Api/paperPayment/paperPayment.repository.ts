import { pool } from "../../configs/db";

export const createPaperPaymentRepo = async (data: {
  paper_id: string;
  author_id: string;
  pages: number;
  price_per_page: number;
  total_amount: number;
  currency: string;
  invoice_number: string;
}) => {
  const result = await pool.query(
    `INSERT INTO paper_payments
      (paper_id, author_id, pages, price_per_page, total_amount, currency, invoice_number, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')
     RETURNING *`,
    [
      data.paper_id,
      data.author_id,
      data.pages,
      data.price_per_page,
      data.total_amount,
      data.currency,
      data.invoice_number,
    ],
  );
  return result.rows[0];
};

export const getPaymentByPaperIdRepo = async (paper_id: string) => {
  const result = await pool.query(
    `SELECT pp.*, u.username AS author_name, u.email AS author_email,
            p.title AS paper_title, j.title AS journal_name, j.publisher_name
     FROM paper_payments pp
     JOIN papers p ON p.id = pp.paper_id
     JOIN journals j ON j.id = p.journal_id
     JOIN users u ON u.id = pp.author_id
     WHERE pp.paper_id = $1`,
    [paper_id],
  );
  return result.rows[0];
};

export const updateReceiptRepo = async (
  paper_id: string,
  receipt_url: string,
) => {
  const result = await pool.query(
    `UPDATE paper_payments
     SET receipt_url = $1,
         receipt_uploaded_at = NOW(),
         status = $2,
         updated_at = NOW()
     WHERE paper_id = $3
     RETURNING *`,
    [receipt_url, 'payment_review', paper_id],
  );
  return result.rows[0];
};

export const approvePaymentRepo = async (
  paper_id: string,
  approved_by: string,
) => {
  const result = await pool.query(
    `UPDATE paper_payments
     SET status = 'success',
         approved_by = $1,
         approved_at = NOW(),
         rejection_reason = NULL,
         updated_at = NOW()
     WHERE paper_id = $2
     RETURNING *`,
    [approved_by, paper_id],
  );
  return result.rows[0];
};

export const rejectPaymentRepo = async (
  paper_id: string,
  rejection_reason: string,
) => {
  const result = await pool.query(
    `UPDATE paper_payments
     SET status = 'failed',
         rejection_reason = $1,
         updated_at = NOW()
     WHERE paper_id = $2
     RETURNING *`,
    [rejection_reason, paper_id],
  );
  return result.rows[0];
};

export const getPendingPaymentsRepo = async () => {
  const result = await pool.query(
    `SELECT pp.*, u.username AS author_name, u.email AS author_email,
            p.title AS paper_title, j.title AS journal_name
     FROM paper_payments pp
     JOIN papers p ON p.id = pp.paper_id
     JOIN journals j ON j.id = p.journal_id
     JOIN users u ON u.id = pp.author_id
     WHERE pp.status = 'payment_review'
     ORDER BY pp.receipt_uploaded_at ASC`,
  );
  return result.rows;
};

export const getAllPaperPaymentsRepo = async () => {
  const result = await pool.query(
    `SELECT pp.*, u.username AS author_name, u.email AS author_email,
            p.title AS paper_title, j.title AS journal_name
     FROM paper_payments pp
     JOIN papers p ON p.id = pp.paper_id
     JOIN journals j ON j.id = p.journal_id
     JOIN users u ON u.id = pp.author_id
     ORDER BY pp.created_at DESC`,
  );
  return result.rows;
};

export const getRejectedPaymentsRepo = async () => {
  const result = await pool.query(
    `SELECT pp.*, u.username AS author_name, u.email AS author_email,
            p.title AS paper_title, j.title AS journal_name
     FROM paper_payments pp
     JOIN papers p ON p.id = pp.paper_id
     JOIN journals j ON j.id = p.journal_id
     JOIN users u ON u.id = pp.author_id
     WHERE pp.status = 'failed'
     ORDER BY pp.updated_at DESC`,
  );
  return result.rows;
};

export const getPaymentReminderInfoRepo = async (paper_id: string) => {
  const result = await pool.query(
    `SELECT pp.*, u.username AS author_name, u.email AS author_email,
            p.title AS paper_title, j.title AS journal_name, j.publisher_name
     FROM paper_payments pp
     JOIN papers p ON p.id = pp.paper_id
     JOIN journals j ON j.id = p.journal_id
     JOIN users u ON u.id = pp.author_id
     WHERE pp.paper_id = $1`,
    [paper_id],
  );
  return result.rows[0];
};

export const updateLastReminderSentRepo = async (paper_id: string) => {
  const result = await pool.query(
    `UPDATE paper_payments
     SET last_reminder_sent_at = NOW(), updated_at = NOW()
     WHERE paper_id = $1
     RETURNING *`,
    [paper_id],
  );
  return result.rows[0];
};
