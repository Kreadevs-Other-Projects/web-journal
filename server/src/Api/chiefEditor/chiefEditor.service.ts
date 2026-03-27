import * as repo from "./chiefEditor.repository";
import { sendSubEditorInviteEmail } from "../../utils/emails/userEmails";
import { pool } from "../../configs/db";
import { insertStatusLog } from "../paper/paper.repository";
import { initiatePaperPaymentService } from "../paperPayment/paperPayment.service";
import { transporter } from "../../configs/email";
import { env } from "../../configs/envs";
import bcrypt from "bcrypt";

export const getChiefEditorJournalsService = async (chiefEditorId: string) => {
  if (!chiefEditorId) {
    throw new Error("Chief Editor ID is required");
  }

  const journals = await repo.getChiefEditorJournals(chiefEditorId);
  return journals;
};

export const getPapersByJournalIdService = async (journalId: string) => {
  if (!journalId) {
    throw new Error("Journal ID is required");
  }

  const papers = await repo.getPapersByJournalId(journalId);

  return papers;
};

export const getChiefEditors = async () => {
  return repo.findChiefEditors();
};

export const fetchAllPapers = async (journalId: string) => {
  return repo.getAllPapers(journalId);
};

export const getSubEditors = async () => {
  return repo.findSubEditors();
};

export const getReviewers = async () => {
  return repo.findReviewers();
};

export const addSubEditor = async (
  paperId: string,
  subEditorId: string,
  assignedBy: string,
) => {
  try {
    return repo.assignSubEditor(paperId, subEditorId, assignedBy);
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      throw new Error(error.message || "Failed to create journal!");
    }
  }
};

export const makeEditorDecision = async (
  paperId: string,
  editorId: string,
  editorEmail: string,
  password: string,
  decision: string,
  note: string,
) => {
  // Credential verification
  const userRes = await pool.query(
    `SELECT * FROM users WHERE id = $1 AND email = $2`,
    [editorId, editorEmail],
  );
  if (!userRes.rows.length) {
    throw new Error("Email does not match your account");
  }
  const passwordValid = await bcrypt.compare(password, userRes.rows[0].password);
  if (!passwordValid) {
    throw new Error("Incorrect password");
  }

  const currentPaper = await repo.getPaperByIdRepo(paperId);
  if (currentPaper?.status === "published") {
    throw new Error("Cannot change the status of a published paper.");
  }

  const decisionRow = await repo.createEditorDecision(
    paperId,
    editorId,
    decision,
    note || "",
  );

  // Map decision values to valid paper_status enum values
  const statusMap: Record<string, string> = {
    revision: "pending_revision",
    accepted: "accepted",
    rejected: "rejected",
  };
  const paperStatus = statusMap[decision] ?? decision;
  const updatedPaper = await repo.updatePaperStatus(paperId, paperStatus);

  // Insert into paper_status_log
  await insertStatusLog({
    paper_id: paperId,
    status: paperStatus,
    changed_by: editorId,
    note: `Chief editor decision: ${decision}. ${note || ""}`.trim(),
  });

  // On acceptance: create payment record
  if (decision === "accepted") {
    const authorRes = await pool.query(
      `SELECT u.id, u.email, u.username FROM users u JOIN papers p ON p.author_id = u.id WHERE p.id = $1`,
      [paperId],
    );
    if (authorRes.rows.length) {
      const author = authorRes.rows[0];
      try {
        await initiatePaperPaymentService(paperId, author.id, author.email, author.username);
      } catch (err) {
        console.error("[payment] initiatePaperPaymentService failed on acceptance:", err);
      }
      await pool.query(
        `UPDATE papers SET status = 'awaiting_payment', updated_at = NOW() WHERE id = $1`,
        [paperId],
      );
      await insertStatusLog({
        paper_id: paperId,
        status: "awaiting_payment",
        changed_by: editorId,
        note: "Paper accepted — awaiting payment",
      });
    }
  }

  return {
    decision: decisionRow,
    paper: updatedPaper,
  };
};

export const replaceSubEditorService = async (
  paperId: string,
  chiefEditorId: string,
  newSubEditorId: string,
) => {
  // Get current assignment and paper/journal info
  const currentRes = await pool.query(
    `SELECT ea.sub_editor_id, p.title, u.email AS old_ae_email, u.username AS old_ae_name
     FROM editor_assignments ea
     JOIN papers p ON p.id = ea.paper_id
     JOIN users u ON u.id = ea.sub_editor_id
     WHERE ea.paper_id = $1 AND ea.status NOT IN ('reassigned', 'rejected')
     ORDER BY ea.assigned_at DESC LIMIT 1`,
    [paperId],
  );

  const newAERes = await pool.query(
    `SELECT email, username FROM users WHERE id = $1`,
    [newSubEditorId],
  );
  if (!newAERes.rows.length) throw new Error("New associate editor not found");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Mark old assignment as reassigned
    await client.query(
      `UPDATE editor_assignments SET status = 'reassigned', completed_at = NOW()
       WHERE paper_id = $1 AND status NOT IN ('reassigned', 'rejected')`,
      [paperId],
    );

    // Insert new assignment
    await client.query(
      `INSERT INTO editor_assignments (paper_id, sub_editor_id, assigned_by, assigned_at, status)
       VALUES ($1, $2, $3, NOW(), 'pending')`,
      [paperId, newSubEditorId, chiefEditorId],
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  // Notify old AE
  if (currentRes.rows.length) {
    const { old_ae_email, old_ae_name, title } = currentRes.rows[0];
    transporter.sendMail({
      from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
      to: old_ae_email,
      subject: `You have been removed from paper "${title}"`,
      text: `Hi ${old_ae_name},\n\nYou have been removed as Associate Editor for the paper "${title}". Another editor has been assigned to this paper.`,
    }).catch(() => {});
  }

  // Notify new AE
  const newAE = newAERes.rows[0];
  const paperRes = await pool.query(`SELECT title FROM papers WHERE id = $1`, [paperId]);
  const title = paperRes.rows[0]?.title || "a paper";
  transporter.sendMail({
    from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
    to: newAE.email,
    subject: `You have been assigned to paper "${title}"`,
    text: `Hi ${newAE.username},\n\nYou have been assigned as Associate Editor for the paper "${title}". Please log in to review the manuscript.`,
  }).catch(() => {});

  return { success: true };
};

export const getPaperDecisionHistoryService = async (paperId: string) => {
  return repo.getPaperDecisionHistoryRepo(paperId);
};

export const changePaperStatus = async (paperId: string, status: string) => {
  const currentPaper = await repo.getPaperByIdRepo(paperId);
  if (currentPaper?.status === "published") {
    throw new Error("Cannot change the status of a published paper.");
  }
  return repo.updatePaperStatus(paperId, status);
};

export const getSubmittedReviews = async (chiefEditorId: string) => {
  return repo.getSubmittedReviewsByChiefEditor(chiefEditorId);
};

export const sendInviteEmailSubEditor = async (email: string) => {
  const signupLink = `${process.env.CORS_ORIGIN}/signup`;

  await sendSubEditorInviteEmail(email, signupLink);

  return { email, signupLink };
};

export const getPapersByIssueService = async (issueId: string) => {
  if (!issueId) throw new Error("Issue ID is required");

  const papers = await repo.getPapersByIssueRepo(issueId);

  return papers.map((paper: any) => ({
    id: paper.id,
    title: paper.title,
    status: paper.status,
    authors: paper.author_name ? [paper.author_name] : [],
    submittedDate: paper.submitted_date,
    issueId: paper.issue_id,
    journalId: paper.journal_id,
  }));
};

export const assignPaperToIssueService = async (
  paperId: string,
  issueId: string,
) => {
  if (!paperId || !issueId) {
    throw new Error("Paper ID and Issue ID are required");
  }

  const issue = await repo.getIssueByIdRepo(issueId);
  if (!issue) {
    throw new Error("Issue not found");
  }
  if (issue.status === "closed" || issue.status === "published") {
    throw new Error(`Cannot assign paper. Issue is ${issue.status}.`);
  }

  const paper = await repo.getPaperByIdRepo(paperId);
  if (!paper) {
    throw new Error("Paper not found");
  }

  if (paper.issue_id) {
    throw new Error("Paper is already assigned to an issue");
  }

  if (paper.journal_id !== issue.journal_id) {
    throw new Error("Paper does not belong to the same journal as this issue");
  }

  return await repo.assignPaperToIssueRepo(paperId, issueId);
};

export const getJournalDetailsService = async (journalId: string, chiefEditorId: string) => {
  const data = await repo.getJournalDetailsRepo(journalId, chiefEditorId);
  if (!data) throw new Error("Journal not found or access denied");
  return data;
};

export const updateIssueStatusService = async (
  issueId: string,
  status: "open" | "closed",
) => {
  if (!["open", "closed"].includes(status)) {
    throw new Error("Invalid status. Must be 'open' or 'closed'");
  }

  const issue = await repo.getIssueByIdRepo(issueId);
  if (!issue) {
    throw new Error("Issue not found");
  }

  try {
    return await repo.updateIssueStatusRepo(issueId, status);
  } catch (err: any) {
    // Unique constraint: one_open_issue_per_journal
    if (err.code === "23505" || err.message?.includes("one_open_issue_per_journal")) {
      throw new Error("Another issue is already open. Close it first before opening a new one.");
    }
    throw err;
  }
};
