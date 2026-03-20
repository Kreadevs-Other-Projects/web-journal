import {
  createJournalIssue,
  getJournalIssues,
  JournalIssueData,
  updateJournalIssue,
  deleteJournalIssue,
  createIssueRequest,
  getIssueRequestsForJournal,
  getPendingIssueRequestsForPublisher,
  reviewIssueRequest,
  getJournalIssuesByManagerJournals,
  getPublishedPapersForManager,
} from "./journalIssue.repository";
import { pool } from "../../configs/db";
import { transporter } from "../../configs/email";
import { env } from "../../configs/envs";

export type { JournalIssueData };

export const addJournalIssueService = async (
  user: { id: string; role: string; email: string; username: string },
  journal_id: string,
  data: JournalIssueData,
) => {
  if (user.role !== "publisher" && user.role !== "journal_manager") {
    throw new Error("Only publishers or journal managers can create journal issues");
  }

  const journalResult = await pool.query(
    `SELECT id, title, owner_id, chief_editor_id FROM journals WHERE id = $1`,
    [journal_id],
  );

  if (!journalResult.rows.length) {
    throw new Error("Journal not found");
  }

  const issue = await createJournalIssue(journal_id, data);

  return { issue };
};

export const getJournalIssuesService = async (
  user: { id: string; role: string },
  journal_id: string,
) => {
  const journal = await pool.query(
    `SELECT id, owner_id FROM journals WHERE id = $1`,
    [journal_id],
  );

  if (!journal.rows.length) {
    throw new Error("Journal not found");
  }

  if (
    journal.rows[0].owner_id !== user.id &&
    user.role !== "publisher" &&
    user.role !== "author"
  ) {
    throw new Error("Forbidden");
  }

  return await getJournalIssues(journal_id);
};

export const updateJournalIssueService = async (
  user: { id: string; role: string },
  issue_id: string,
  data: JournalIssueData,
) => {
  if (user.role !== "owner" && user.role !== "publisher") {
    throw new Error("Only owners or publishers can create journal issues");
  }

  return await updateJournalIssue(issue_id, data);
};

export const deleteJournalIssueService = async (
  user: { id: string; role: string },
  issue_id: string,
) => {
  if (user.role !== "owner" && user.role !== "publisher") {
    throw new Error("Only owners can delete journal issues");
  }

  await deleteJournalIssue(issue_id);
};

// ---- Issue Requests ----

export const requestNewIssueService = async (
  user: { id: string; role: string; username: string; email: string },
  data: { journal_id: string; label: string; volume?: number; issue_no?: number; year?: number },
) => {
  const request = await createIssueRequest({ ...data, requested_by: user.id });

  // Notify publisher by email
  const journalRes = await pool.query(
    `SELECT j.title, u.email as publisher_email, u.username as publisher_name
     FROM journals j JOIN users u ON u.id = j.owner_id WHERE j.id = $1`,
    [data.journal_id],
  );
  if (journalRes.rows.length) {
    const { publisher_email, publisher_name, title } = journalRes.rows[0];
    transporter.sendMail({
      from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
      to: publisher_email,
      subject: `New Issue Request — ${title}`,
      text: `Hi ${publisher_name},\n\n${user.username} (Journal Manager) has requested a new issue for "${title}".\n\nDetails: ${data.label}${data.volume ? `, Vol ${data.volume}` : ""}${data.issue_no ? `, Issue ${data.issue_no}` : ""}${data.year ? `, ${data.year}` : ""}.\n\nPlease log in to review this request.`,
    }).catch(() => {});
  }

  return request;
};

export const getMyIssuesService = async (user_id: string) => {
  return getJournalIssuesByManagerJournals(user_id);
};

export const getManagerPapersService = async (user_id: string) => {
  return getPublishedPapersForManager(user_id);
};

export const getMyIssueRequestsService = async (journal_id: string) => {
  return getIssueRequestsForJournal(journal_id);
};

export const getPendingIssueRequestsService = async (publisher_id: string) => {
  return getPendingIssueRequestsForPublisher(publisher_id);
};

export const reviewIssueRequestService = async (
  user: { id: string; role: string },
  request_id: string,
  action: "approved" | "rejected",
) => {
  const reqRes = await pool.query(`SELECT * FROM issue_requests WHERE id = $1`, [request_id]);
  if (!reqRes.rows.length) throw new Error("Request not found");
  const req = reqRes.rows[0];

  const updated = await reviewIssueRequest(request_id, action, user.id);

  if (action === "approved") {
    // Create the actual issue
    await createJournalIssue(req.journal_id, {
      label: req.label,
      volume: req.volume,
      issue: req.issue_no,
      year: req.year,
    });

    // Notify the journal manager
    const notifyRes = await pool.query(
      `SELECT u.email, u.username FROM users u WHERE u.id = $1`,
      [req.requested_by],
    );
    if (notifyRes.rows.length) {
      const { email, username } = notifyRes.rows[0];
      transporter.sendMail({
        from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
        to: email,
        subject: "Your Issue Request Has Been Approved",
        text: `Hi ${username},\n\nYour request for issue "${req.label}" has been approved and the issue has been created.`,
      }).catch(() => {});
    }
  }

  return updated;
};
