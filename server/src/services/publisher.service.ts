import { pool } from "../configs/db";
import * as repo from "../repositories/publisher.repository";
import { sendInvoiceEmail, paperPaymentEmail } from "../utils/email";

export type Journal = {
  journalId: string;
  year: number;
  volume: number;
  issue: number;
  label: string;
};

export const approveJournalService = async (
  journalId: string,
  issueId: string,
) => {
  const chiefEditorId = await repo.approveJournalRepo(journalId, issueId);
  if (!chiefEditorId)
    throw new Error("Journal not found or no chief editor assigned");

  await repo.activateUserRepo(chiefEditorId);

  return { journalId, chiefEditorId };
};

export const fetchPublisherJournals = async () => {
  return repo.getPublisherJournals();
};

export const journalPaymentInvoice = async (
  user: { id: string; role: string },
  journalId: string,
  issueId: string,
  amount: number,
) => {
  if (user.role !== "publisher") {
    throw new Error("Only owners can generate journal invoices");
  }

  const { rows } = await pool.query(
    `
      SELECT j.id AS journal_id, 
             j.title AS journal_name,
             j.owner_id,
             u.username AS owner_name, 
             u.email AS owner_email,
             ji.label AS issue_label
      FROM journals j
      JOIN users u ON u.id = j.owner_id
      LEFT JOIN journal_issues ji ON ji.id = $1
      WHERE j.id = $2
      `,
    [issueId, journalId],
  );

  if (!rows[0]) {
    throw new Error("Journal not found");
  }

  const info = rows[0];

  const payment = await repo.createJournalPayment({
    journalId,
    ownerId: info.owner_id,
    issueId,
    amount,
    status: "pending",
  });

  await sendInvoiceEmail({
    email: info.owner_email,
    username: info.owner_name,
    journalName: info.journal_name,
    issueLabel: info.issue_label || "N/A",
    amount: payment.amount,
    currency: payment.currency,
    invoiceId: payment.id,
    status: payment.status,
  });

  return payment;
};

export const fetchJournalIssues = async (journalId: string) => {
  return repo.getJournalIssues(journalId);
};

export const setIssuePublished = async (issueId: string) => {
  return repo.publishIssue(issueId);
};

export const fetchJournalPapers = async (journalId: string) => {
  return repo.getJournalPapers(journalId);
};

export const getPapersByIssueIdService = async (issueId: string) => {
  const papers = await repo.getPapersByIssueIdRepo(issueId);

  return {
    count: papers.length,
    papers,
  };
};

export const sendPaperPaymentInvoice = async ({
  paperId,
  authorId,
  pages,
  pricePerPage,
  currency = "USD",
  username,
  journalName,
  label,
  authorEmail,
  title,
}: {
  paperId: string;
  authorId: string;
  pages: number;
  pricePerPage: number;
  currency?: string;
  username: string;
  journalName: string;
  label: string;
  authorEmail: string;
  title: string;
}) => {
  const client = await pool.connect();
  const totalAmount = pages * pricePerPage;
  const status = "pending";

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO paper_payments 
        (paper_id, author_id, pages, price_per_page, total_amount, currency, status) 
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [paperId, authorId, pages, pricePerPage, totalAmount, currency, status],
    );

    const paymentId = rows[0].id;

    await paperPaymentEmail({
      email: authorEmail,
      username,
      title,
      paymentId,
      pages,
      pricePerPage,
      totalAmount,
      journalName,
      label,
    });

    await client.query("COMMIT");
    return { totalAmount, currency, status, paymentId };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to send paper payment invoice:", error);
    throw new Error("Payment email or DB insert failed");
  } finally {
    client.release();
  }
};

export const approvePaperPaymentService = async (id: string) => {
  if (!id) {
    throw new Error("Payment ID is required");
  }

  const payment = await repo.approvePaperPaymentRepo(id);

  if (!payment) {
    throw new Error("Payment not found");
  }

  return payment;
};
