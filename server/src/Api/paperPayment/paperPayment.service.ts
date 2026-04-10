import { pool } from "../../configs/db";
import {
  createPaperPaymentRepo,
  getPaymentByPaperIdRepo,
  updateReceiptRepo,
  approvePaymentRepo,
  rejectPaymentRepo,
  getPendingPaymentsRepo,
  getAllPaperPaymentsRepo,
  getRejectedPaymentsRepo,
  getPaymentReminderInfoRepo,
  updateLastReminderSentRepo,
} from "./paperPayment.repository";

import {
  sendInvoiceEmail,
  sendReceiptNotificationEmail,
  sendPaymentApprovalEmail,
  sendPaymentReminderEmail,
} from "../../utils/emails/invoiceEmail";
import { env } from "../../configs/envs";

const DEFAULT_PAGES = 10;

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `INV-${year}-${rand}`;
}

function formatDateStr(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const initiatePaperPaymentService = async (
  paperId: string,
  authorId: string,
  authorEmail: string,
  authorName: string,
): Promise<any> => {
  // Fetch paper + journal fee
  const paperRes = await pool.query(
    `SELECT p.title, p.journal_id, j.publication_fee, j.currency, j.title AS journal_name, j.publisher_name
     FROM papers p
     JOIN journals j ON j.id = p.journal_id
     WHERE p.id = $1`,
    [paperId],
  );
  if (!paperRes.rows.length)
    throw new Error("Paper not found for payment initiation");
  const row = paperRes.rows[0];

  const pricePerPage =
    row.publication_fee != null ? parseFloat(row.publication_fee) : 50;
  const currency = row.currency || "USD";
  const pages = DEFAULT_PAGES;
  const totalAmount = pricePerPage * pages;
  const invoiceNumber = generateInvoiceNumber();

  const payment = await createPaperPaymentRepo({
    paper_id: paperId,
    author_id: authorId,
    pages,
    price_per_page: pricePerPage,
    total_amount: totalAmount,
    currency,
    invoice_number: invoiceNumber,
  });

  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + 7);

  sendInvoiceEmail({
    authorName,
    authorEmail,
    paperTitle: row.title,
    journalName: row.journal_name,
    invoiceNumber,
    invoiceDate: formatDateStr(now),
    dueDate: formatDateStr(due),
    pages,
    pricePerPage,
    totalAmount,
    currency,
    publisherName: row.publisher_name || "Publisher",
  }).catch((err) => console.error("[payment] invoice email failed:", err));

  return payment;
};

export const uploadReceiptService = async (
  paperId: string,
  authorId: string,
  receiptUrl: string,
): Promise<any> => {
  // Verify author owns this paper
  const paperRes = await pool.query(
    `SELECT p.author_id, p.title, j.title AS journal_name
     FROM papers p JOIN journals j ON j.id = p.journal_id
     WHERE p.id = $1`,
    [paperId],
  );
  if (!paperRes.rows.length) throw new Error("Paper not found");
  if (paperRes.rows[0].author_id !== authorId) throw new Error("Forbidden");

  const payment = await updateReceiptRepo(paperId, receiptUrl);
  // Notify publisher (best-effort)
  const publisherRes = await pool.query(
    `SELECT u.email FROM users u WHERE u.role = 'publisher' LIMIT 1`,
  );
  if (publisherRes.rows.length) {
    sendReceiptNotificationEmail({
      publisherEmail: publisherRes.rows[0].email,
      authorName: authorId,
      paperTitle: paperRes.rows[0].title,
      invoiceNumber: payment.invoice_number || "",
      paperUrl: `${env.CORS_ORIGIN || "http://localhost:5173"}/publisher`,
    }).catch(() => {});
  }

  return payment;
};

export const approveOrRejectPaymentService = async (
  paperId: string,
  publisherId: string,
  approved: boolean,
  rejectionReason?: string,
): Promise<any> => {
  const existing = await getPaymentByPaperIdRepo(paperId);
  if (!existing) throw new Error("Payment record not found");

  if (approved) {
    const payment = await approvePaymentRepo(paperId, publisherId);
    await pool.query(
      `UPDATE papers SET status = 'ready_for_publication', updated_at = NOW() WHERE id = $1`,
      [paperId],
    );
    sendPaymentApprovalEmail({
      authorEmail: existing.author_email,
      authorName: existing.author_name,
      paperTitle: existing.paper_title,
      approved: true,
    }).catch(() => {});
    return payment;
  } else {
    const payment = await rejectPaymentRepo(
      paperId,
      rejectionReason || "Receipt rejected",
    );
    sendPaymentApprovalEmail({
      authorEmail: existing.author_email,
      authorName: existing.author_name,
      paperTitle: existing.paper_title,
      approved: false,
      rejectionReason,
    }).catch(() => {});
    return payment;
  }
};

export const getPaymentByPaperService = async (
  paperId: string,
  userId: string,
  userRole: string,
): Promise<any> => {
  const payment = await getPaymentByPaperIdRepo(paperId);
  if (!payment) throw new Error("Payment not found");

  // author can only see own paper's payment
  if (userRole === "author" && payment.author_id !== userId) {
    throw new Error("Forbidden");
  }

  return payment;
};

export const getPendingPaymentsService = async () => {
  return getPendingPaymentsRepo();
};

export const getAllPaperPaymentsService = async () => {
  return getAllPaperPaymentsRepo();
};

export const getRejectedPaymentsService = async () => {
  return getRejectedPaymentsRepo();
};

export const resendInvoiceService = async (paperId: string): Promise<void> => {
  const payment = await getPaymentReminderInfoRepo(paperId);
  if (!payment) throw new Error("Payment not found");

  const now = new Date();
  const invoiceDate = payment.created_at
    ? new Date(payment.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : formatDateStr(now);

  const due = new Date(now);
  due.setDate(due.getDate() + 7);

  await sendInvoiceEmail({
    authorName: payment.author_name,
    authorEmail: payment.author_email,
    paperTitle: payment.paper_title,
    journalName: payment.journal_name,
    invoiceNumber: payment.invoice_number || generateInvoiceNumber(),
    invoiceDate,
    dueDate: formatDateStr(due),
    pages: payment.pages || DEFAULT_PAGES,
    pricePerPage: parseFloat(payment.price_per_page) || 50,
    totalAmount: payment.total_amount,
    currency: payment.currency || "USD",
    publisherName: payment.publisher_name || "Publisher",
  });
};

export const sendPaymentReminderService = async (
  paperId: string,
): Promise<{ authorEmail: string }> => {
  const payment = await getPaymentReminderInfoRepo(paperId);
  if (!payment) throw new Error("Payment not found");

  if (payment.last_reminder_sent_at) {
    const last = new Date(payment.last_reminder_sent_at).getTime();
    const diffHours = (Date.now() - last) / (1000 * 60 * 60);
    if (diffHours < 24) {
      throw new Error(
        "Reminder already sent in the last 24 hours. Please wait before sending another.",
      );
    }
  }

  const paperUrl = `${env.CORS_ORIGIN || "http://localhost:5173"}/author`;
  const invoiceDate = payment.created_at
    ? new Date(payment.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  await sendPaymentReminderEmail({
    authorName: payment.author_name,
    authorEmail: payment.author_email,
    paperTitle: payment.paper_title,
    journalName: payment.journal_name,
    invoiceNumber: payment.invoice_number || "—",
    invoiceDate,
    totalAmount: payment.total_amount,
    currency: payment.currency || "USD",
    paperUrl,
  });

  await updateLastReminderSentRepo(paperId);

  return { authorEmail: payment.author_email };
};
