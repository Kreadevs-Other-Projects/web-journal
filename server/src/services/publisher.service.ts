import { pool } from "../configs/db";
import * as repo from "../repositories/publisher.repository";
import { sendInvoiceEmail } from "../utils/email";

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

export const journalPaymentService = {
  sendInvoice: async ({
    journalId,
    issueId,
    amount,
  }: {
    journalId: string;
    issueId?: string;
    amount: number;
  }) => {
    const { rows } = await pool.query(
      `
      SELECT j.id AS journal_id, j.title AS journal_name,
             u.id AS owner_id, u.username AS owner_name, u.email AS owner_email,
             ji.label AS issue_label
      FROM journals j
      JOIN users u ON u.id = j.owner_id
      LEFT JOIN journal_issues ji ON ji.id = $1
      WHERE j.id = $2
      `,
      [issueId || null, journalId],
    );

    if (!rows[0]) throw new Error("Journal not found");

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
      amount: Number(payment.amount),
      currency: payment.currency,
      invoiceId: payment.id,
      status: payment.status,
    });

    return payment;
  },
};

export const fetchJournalIssues = async (journalId: string) => {
  return repo.getJournalIssues(journalId);
};

export const addJournalIssue = async (journalId: string, data: Journal) => {
  return repo.createJournalIssue(
    journalId,
    data.year,
    data.volume,
    data.issue,
    data.label,
  );
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
