import {
  createPaperPayment,
  getPaymentByPaperIdRepo,
  markPaymentPaidRepo,
} from "./paperPayment.repository";
import { pool } from "../../configs/db";

export const createPaperPaymentService = async (
  user: { id: string; role: string },
  paper_id: string,
  amount: number,
) => {
  if (user.role !== "publisher") {
    throw new Error("Only authors can create paper payment");
  }

  const paper = await pool.query(
    `SELECT id, author_id FROM papers WHERE id=$1`,
    [paper_id],
  );

  if (!paper.rows.length) throw new Error("Paper not found");

  // if (paper.rows[0].author_id !== user.id) {
  //   throw new Error("Forbidden");
  // }

  const existing = await getPaymentByPaperIdRepo(paper_id);
  if (existing) return existing;

  return pool
    .query(
      `
      INSERT INTO paper_payments
      (paper_id, author_id, pages, price_per_page, total_amount)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `,
      [paper_id, user.id, 1, amount, amount],
    )
    .then((res) => res.rows[0]);
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
