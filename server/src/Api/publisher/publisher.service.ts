import { pool } from "../../configs/db";
import * as repo from "./publisher.repository";
import {
  sendInvoiceEmail,
  sendPaperPaymentEmail,
} from "../../utils/emails/paymentEmails";
import { transporter } from "../../configs/email";
import { env } from "../../configs/envs";
import { baseEmailTemplate } from "../../utils/emails/baseEmailTemplate";

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
  await repo.approveJournalRepo(journalId, issueId);
  return { journalId, issueId };
};

export const fetchPublisherJournals = async (publisherId: string) => {
  return repo.getPublisherJournals(publisherId);
};

export const replaceChiefEditorService = async (
  journalId: string,
  publisherId: string,
) => {
  await repo.replaceChiefEditorRepo(journalId, publisherId);
  return { message: "Chief editor removed. You can now invite a new one." };
};

export const replaceJournalManagerService = async (
  journalId: string,
  publisherId: string,
) => {
  await repo.replaceJournalManagerRepo(journalId, publisherId);
  return { message: "Journal manager removed. You can now invite a new one." };
};

export const journalPaymentInvoice = async (
  user: { id: string; role: string },
  journalId: string,
  issueId: string,
  amount: number,
) => {
  if (user.role !== "publisher") {
    throw new Error("Only publishers can generate journal invoices");
  }

  const { rows } = await pool.query(
    `
      SELECT j.id        AS journal_id, 
             j.title     AS journal_name,
             j.owner_id,
             u.username  AS owner_name, 
             u.email     AS owner_email,
             ji.label    AS issue_label,
             ji.article_index,
             ji.created_at AS issue_created_at
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
  let finalAmount = amount;

  if (issueId) {
    if (info.article_index === 1) {
      finalAmount = amount;
    } else {
      const { rows: firstArticleRows } = await pool.query(
        `
          SELECT created_at
          FROM journal_issues
          WHERE journal_id = $1 AND article_index = 1
          LIMIT 1
        `,
        [journalId],
      );

      if (!firstArticleRows[0]) {
        throw new Error("No article_index 1 found for this journal");
      }

      const startDate = new Date(firstArticleRows[0].created_at);

      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const issueCreatedAt = new Date(info.issue_created_at);

      const totalDays = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      const daysRemaining = Math.max(
        0,
        Math.round(
          (endDate.getTime() - issueCreatedAt.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );

      finalAmount = parseFloat(
        ((amount * daysRemaining) / totalDays).toFixed(2),
      );
    }

    await pool.query(`UPDATE journal_issues SET amount = $1 WHERE id = $2`, [
      finalAmount,
      issueId,
    ]);
  }

  const payment = await repo.createJournalPayment({
    journalId,
    ownerId: info.owner_id,
    issueId,
    amount: finalAmount,
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

    await sendPaperPaymentEmail({
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

export const fetchJournalPayments = async () => {
  const payments = await repo.getPaymentsByJournal();
  return payments;
};

export const takedownJournalService = async (
  journalId: string,
  reason: string,
  publisherId: string,
) => {
  await repo.takedownJournalRepo(journalId, reason, publisherId);
  const ceRow = await repo.getJournalChiefEditorEmail(journalId);
  if (ceRow && (ceRow as any).email) {
    transporter.sendMail({
      from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
      to: (ceRow as any).email,
      subject: `Journal Taken Down — ${(ceRow as any).journal_title}`,
      html: baseEmailTemplate(
      "Journal Taken Down",
      `<p>Dear Chief Editor,</p>
       <p>The journal <strong>${(ceRow as any).journal_title}</strong> has been taken down by the Publisher.</p>
       <p><strong>Reason:</strong> ${reason}</p>
       <p>Please contact the Publisher for more information.</p>`,
    ),
      text: `Journal "${(ceRow as any).journal_title}" has been taken down. Reason: ${reason}`,
    }).catch(() => {});
  }
};

export const restoreJournalService = async (journalId: string) => {
  await repo.restoreJournalRepo(journalId);
};

export const takedownIssueService = async (issueId: string, reason: string, publisherId: string) => {
  await repo.takedownIssueRepo(issueId, reason, publisherId);
};

export const restoreIssueService = async (issueId: string) => {
  await repo.restoreIssueRepo(issueId);
};

export const takedownPaperService = async (paperId: string, reason: string, publisherId: string) => {
  return repo.takedownPaperRepo(paperId, reason, publisherId);
};

export const restorePaperService = async (paperId: string) => {
  return repo.restorePaperRepo(paperId);
};

export const updatePaymentStatus = async (
  paymentId: string,
  status: "success" | "failed",
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const payment = await repo.getPaymentById(paymentId);

    if (!payment) throw new Error("Payment not found");

    await repo.updatePaymentStatus(paymentId, status);

    if (status === "success") {
      await repo.updateJournalStatus(payment.journal_id, "active");
    }

    await client.query("COMMIT");

    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
