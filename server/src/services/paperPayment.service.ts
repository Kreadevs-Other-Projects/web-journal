import {
  createPaperPaymentRepo,
  getPaymentByPaperIdRepo,
  markPaymentPaidRepo,
} from "../repositories/paperPayment.repository";
import { pool } from "../configs/db";

const PRICE_PER_PAGE = 5;

export const createPaperPaymentService = async (
  user: { id: string; role: string },
  paper_id: string,
) => {
  if (user.role !== "author") {
    throw new Error("Only authors can create paper payment");
  }

  const paper = await pool.query(
    `SELECT id, author_id FROM papers WHERE id=$1`,
    [paper_id],
  );

  if (!paper.rows.length) throw new Error("Paper not found");

  const p = paper.rows[0];

  if (p.author_id !== user.id) {
    throw new Error("Forbidden");
  }

  const existing = await getPaymentByPaperIdRepo(paper_id);
  if (existing) return existing;

  const pageCount = 1;

  return createPaperPaymentRepo(paper_id, user.id, pageCount, PRICE_PER_PAGE);
};

export const payPaperPaymentService = async (
  user: { id: string; role: string },
  payment_id: string,
  transaction_ref: string,
) => {
  const payment = await pool.query(`SELECT * FROM paper_payments WHERE id=$1`, [
    payment_id,
  ]);

  if (!payment.rows.length) throw new Error("Payment not found");

  const row = payment.rows[0];

  if (row.author_id !== user.id) throw new Error("Forbidden");

  if (row.status === "paid") {
    throw new Error("Already paid");
  }

  return markPaymentPaidRepo(payment_id, transaction_ref);
};
