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

export const getCEStatsService = async (chiefEditorId: string) => {
  return repo.getCEStatsRepo(chiefEditorId);
};

export const overridePaperStatusService = async (
  paperId: string,
  chiefEditorId: string,
  editorEmail: string,
  password: string,
  newStatus: string,
  reason: string,
) => {
  // Credential verification
  const userRes = await pool.query(
    `SELECT * FROM users WHERE id = $1 AND email = $2`,
    [chiefEditorId, editorEmail],
  );
  if (!userRes.rows.length) throw new Error("Email does not match your account");
  const passwordValid = await bcrypt.compare(password, userRes.rows[0].password);
  if (!passwordValid) throw new Error("Incorrect password");

  // Verify paper belongs to CE's journal
  const paperRes = await pool.query(
    `SELECT p.*, u.email AS author_email, u.username AS author_name
     FROM papers p
     JOIN journals j ON j.id = p.journal_id
     JOIN users u ON u.id = p.author_id
     WHERE p.id = $1 AND j.chief_editor_id = $2`,
    [paperId, chiefEditorId],
  );
  if (!paperRes.rows.length) throw new Error("Paper not found or access denied");
  if (paperRes.rows[0].status === "published") throw new Error("Cannot override status of a published paper");

  const paper = paperRes.rows[0];

  await pool.query(`UPDATE papers SET status = $1, updated_at = NOW() WHERE id = $2`, [newStatus, paperId]);

  await insertStatusLog({
    paper_id: paperId,
    status: newStatus,
    changed_by: chiefEditorId,
    note: `Status overridden by Chief Editor. Reason: ${reason}`,
  });

  // Email author
  transporter.sendMail({
    from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
    to: paper.author_email,
    subject: `Status update for your paper: "${paper.title}"`,
    html: `<p>Dear ${paper.author_name},</p>
<p>The status of your paper <strong>"${paper.title}"</strong> has been updated to <strong>${newStatus.replace(/_/g, " ")}</strong> by the Chief Editor.</p>
<p><strong>Reason:</strong> ${reason}</p>
<p>Please log in to your dashboard for more details.</p>
<p>Best regards,<br/>GIKI JournalHub</p>`,
  }).catch(console.error);

  return { success: true };
};

export const remindAEService = async (paperId: string, chiefEditorId: string) => {
  // Get current AE for this paper
  const aeRes = await pool.query(
    `SELECT u.id, u.email, u.username, p.title
     FROM editor_assignments ea
     JOIN users u ON u.id = ea.sub_editor_id
     JOIN papers p ON p.id = ea.paper_id
     JOIN journals j ON j.id = p.journal_id
     WHERE ea.paper_id = $1 AND j.chief_editor_id = $2
       AND ea.status NOT IN ('reassigned', 'rejected', 'completed')
     ORDER BY ea.assigned_at DESC LIMIT 1`,
    [paperId, chiefEditorId],
  );
  if (!aeRes.rows.length) throw new Error("No active associate editor found for this paper");

  const ae = aeRes.rows[0];

  // 24-hour cooldown check
  const lastReminder = await repo.getLastReminderRepo(paperId, ae.id);
  if (lastReminder) {
    const hoursSince = (Date.now() - new Date(lastReminder.sent_at).getTime()) / 3600000;
    if (hoursSince < 24) {
      const hoursLeft = Math.ceil(24 - hoursSince);
      throw new Error(`Reminder already sent. Please wait ${hoursLeft} more hour(s) before sending another.`);
    }
  }

  await repo.insertReminderRepo(paperId, ae.id, chiefEditorId, "sub_editor");

  transporter.sendMail({
    from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
    to: ae.email,
    subject: `Reminder: Action required for paper "${ae.title}"`,
    html: `<p>Dear ${ae.username},</p>
<p>This is a friendly reminder that your review and decision is pending for the paper:</p>
<p><strong>"${ae.title}"</strong></p>
<p>Please log in to your Associate Editor dashboard to take action at your earliest convenience.</p>
<p>Best regards,<br/>GIKI JournalHub Editorial Team</p>`,
  }).catch(console.error);

  return { message: `Reminder sent to ${ae.username}` };
};

export const remindAllReviewersService = async (paperId: string, chiefEditorId: string) => {
  // Get all pending (assigned, not submitted) reviewers for this paper under CE's journals
  const res = await pool.query(
    `SELECT u.id, u.email, u.username, p.title
     FROM review_assignments ra
     JOIN users u ON u.id = ra.reviewer_id
     JOIN papers p ON p.id = ra.paper_id
     JOIN journals j ON j.id = p.journal_id
     WHERE ra.paper_id = $1 AND j.chief_editor_id = $2
       AND ra.status = 'assigned'`,
    [paperId, chiefEditorId],
  );
  if (!res.rows.length) throw new Error("No pending reviewers found for this paper");

  const reminded: string[] = [];
  const skipped: string[] = [];

  for (const reviewer of res.rows) {
    const lastReminder = await repo.getLastReminderRepo(paperId, reviewer.id);
    if (lastReminder) {
      const hoursSince = (Date.now() - new Date(lastReminder.sent_at).getTime()) / 3600000;
      if (hoursSince < 24) {
        skipped.push(reviewer.username);
        continue;
      }
    }

    await repo.insertReminderRepo(paperId, reviewer.id, chiefEditorId, "reviewer");

    transporter.sendMail({
      from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
      to: reviewer.email,
      subject: `Reminder: Review pending for paper "${reviewer.title}"`,
      html: `<p>Dear ${reviewer.username},</p>
<p>This is a friendly reminder that your peer review is pending for the paper:</p>
<p><strong>"${reviewer.title}"</strong></p>
<p>Please log in to your Reviewer dashboard to complete your review at your earliest convenience. Your timely review is critical to the publication process.</p>
<p>Best regards,<br/>GIKI JournalHub Editorial Team</p>`,
    }).catch(console.error);

    reminded.push(reviewer.username);
  }

  if (reminded.length === 0) {
    const minHours = Math.ceil(24);
    throw new Error(`All reviewers were reminded recently. Please wait before sending another reminder.`);
  }

  return {
    message: `Reminder sent to ${reminded.join(", ")}${skipped.length ? `. Skipped (cooldown): ${skipped.join(", ")}` : ""}`,
  };
};

export const remindAEBulkService = async (aeId: string, chiefEditorId: string) => {
  // Get all pending papers for this AE under CE's journals
  const res = await pool.query(
    `SELECT p.id AS paper_id, p.title
     FROM editor_assignments ea
     JOIN papers p ON p.id = ea.paper_id
     JOIN journals j ON j.id = p.journal_id
     LEFT JOIN sub_editor_decisions sd ON sd.paper_id = p.id AND sd.sub_editor_id = ea.sub_editor_id
     WHERE ea.sub_editor_id = $1
       AND j.chief_editor_id = $2
       AND ea.status NOT IN ('reassigned', 'rejected', 'completed')
       AND sd.id IS NULL`,
    [aeId, chiefEditorId],
  );
  if (!res.rows.length) throw new Error("No pending papers found for this associate editor");

  const aeRes = await pool.query(`SELECT email, username FROM users WHERE id = $1`, [aeId]);
  if (!aeRes.rows.length) throw new Error("Associate editor not found");
  const ae = aeRes.rows[0];

  // Check cooldown against the first pending paper
  const firstPaperId = res.rows[0].paper_id;
  const lastReminder = await repo.getLastReminderRepo(firstPaperId, aeId);
  if (lastReminder) {
    const hoursSince = (Date.now() - new Date(lastReminder.sent_at).getTime()) / 3600000;
    if (hoursSince < 24) {
      const hoursLeft = Math.ceil(24 - hoursSince);
      throw new Error(`Reminder already sent recently. Please wait ${hoursLeft} more hour(s).`);
    }
  }

  for (const row of res.rows) {
    await repo.insertReminderRepo(row.paper_id, aeId, chiefEditorId, "sub_editor");
  }

  const paperList = res.rows.map((r: any, i: number) => `${i + 1}. ${r.title}`).join("<br/>");
  transporter.sendMail({
    from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
    to: ae.email,
    subject: `Follow-up: ${res.rows.length} paper(s) awaiting your decision`,
    html: `<p>Dear ${ae.username},</p>
<p>This is a follow-up reminder. The following ${res.rows.length} paper(s) are awaiting your decision:</p>
<p>${paperList}</p>
<p>Please log in to your Associate Editor dashboard to take action at your earliest convenience.</p>
<p>Best regards,<br/>GIKI JournalHub Editorial Team</p>`,
  }).catch(console.error);

  return { message: `Reminder sent for ${res.rows.length} pending paper(s)` };
};

export const remindReviewerBulkService = async (reviewerId: string, chiefEditorId: string) => {
  // Get all pending review assignments for this reviewer
  const res = await pool.query(
    `SELECT p.id AS paper_id, p.title
     FROM review_assignments ra
     JOIN papers p ON p.id = ra.paper_id
     JOIN journals j ON j.id = p.journal_id
     WHERE ra.reviewer_id = $1
       AND j.chief_editor_id = $2
       AND ra.status = 'assigned'`,
    [reviewerId, chiefEditorId],
  );
  if (!res.rows.length) throw new Error("No pending reviews found for this reviewer");

  const rvRes = await pool.query(`SELECT email, username FROM users WHERE id = $1`, [reviewerId]);
  if (!rvRes.rows.length) throw new Error("Reviewer not found");
  const reviewer = rvRes.rows[0];

  const firstPaperId = res.rows[0].paper_id;
  const lastReminder = await repo.getLastReminderRepo(firstPaperId, reviewerId);
  if (lastReminder) {
    const hoursSince = (Date.now() - new Date(lastReminder.sent_at).getTime()) / 3600000;
    if (hoursSince < 24) {
      const hoursLeft = Math.ceil(24 - hoursSince);
      throw new Error(`Reminder already sent recently. Please wait ${hoursLeft} more hour(s).`);
    }
  }

  for (const row of res.rows) {
    await repo.insertReminderRepo(row.paper_id, reviewerId, chiefEditorId, "reviewer");
  }

  const paperList = res.rows.map((r: any, i: number) => `${i + 1}. ${r.title}`).join("<br/>");
  transporter.sendMail({
    from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
    to: reviewer.email,
    subject: `Follow-up: ${res.rows.length} review(s) awaiting your submission`,
    html: `<p>Dear ${reviewer.username},</p>
<p>This is a follow-up reminder. The following ${res.rows.length} paper(s) are awaiting your review:</p>
<p>${paperList}</p>
<p>Please log in to your Reviewer dashboard to complete your reviews at your earliest convenience.</p>
<p>Best regards,<br/>GIKI JournalHub Editorial Team</p>`,
  }).catch(console.error);

  return { message: `Reminder sent for ${res.rows.length} pending review(s)` };
};

export const remindReviewerService = async (
  paperId: string,
  reviewerId: string,
  chiefEditorId: string,
) => {
  // Verify paper belongs to CE's journal and reviewer is assigned
  const res = await pool.query(
    `SELECT u.id, u.email, u.username, p.title
     FROM review_assignments ra
     JOIN users u ON u.id = ra.reviewer_id
     JOIN papers p ON p.id = ra.paper_id
     JOIN journals j ON j.id = p.journal_id
     WHERE ra.paper_id = $1 AND ra.reviewer_id = $2 AND j.chief_editor_id = $3
       AND ra.status = 'assigned'
     ORDER BY ra.assigned_at DESC LIMIT 1`,
    [paperId, reviewerId, chiefEditorId],
  );
  if (!res.rows.length) throw new Error("Reviewer not found or not actively assigned to this paper");

  const reviewer = res.rows[0];

  const lastReminder = await repo.getLastReminderRepo(paperId, reviewer.id);
  if (lastReminder) {
    const hoursSince = (Date.now() - new Date(lastReminder.sent_at).getTime()) / 3600000;
    if (hoursSince < 24) {
      const hoursLeft = Math.ceil(24 - hoursSince);
      throw new Error(`Reminder already sent. Please wait ${hoursLeft} more hour(s) before sending another.`);
    }
  }

  await repo.insertReminderRepo(paperId, reviewer.id, chiefEditorId, "reviewer");

  transporter.sendMail({
    from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
    to: reviewer.email,
    subject: `Reminder: Review pending for paper "${reviewer.title}"`,
    html: `<p>Dear ${reviewer.username},</p>
<p>This is a friendly reminder that your peer review is pending for the paper:</p>
<p><strong>"${reviewer.title}"</strong></p>
<p>Please log in to your Reviewer dashboard to complete your review at your earliest convenience. Your timely review is critical to the publication process.</p>
<p>Best regards,<br/>GIKI JournalHub Editorial Team</p>`,
  }).catch(console.error);

  return { message: `Reminder sent to ${reviewer.username}` };
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
