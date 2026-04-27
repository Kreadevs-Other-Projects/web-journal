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
  getNextIssueSerial,
} from "./journalIssue.repository";
import { pool } from "../../configs/db";
import { transporter } from "../../configs/email";
import { env } from "../../configs/envs";
import { baseEmailTemplate } from "../../utils/emails/baseEmailTemplate";

export type { JournalIssueData };

export const getNextIssuePreviewService = async (journal_id: string) => {
  const journalResult = await pool.query(
    `SELECT id FROM journals WHERE id = $1`,
    [journal_id],
  );
  if (!journalResult.rows.length) throw new Error("Journal not found");
  return getNextIssueSerial(journal_id);
};

export const addJournalIssueService = async (
  user: { id: string; role: string; email: string; username: string },
  journal_id: string,
) => {
  if (user.role !== "publisher" && user.role !== "journal_manager") {
    throw new Error(
      "Only publishers or journal managers can create journal issues",
    );
  }

  const journalResult = await pool.query(
    `SELECT id, title, owner_id, chief_editor_id FROM journals WHERE id = $1`,
    [journal_id],
  );

  if (!journalResult.rows.length) {
    throw new Error("Journal not found");
  }

  const serial = await getNextIssueSerial(journal_id);
  const issue = await createJournalIssue(journal_id, serial);

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
  data: { journal_id: string },
) => {
  const serial = await getNextIssueSerial(data.journal_id);
  const request = await createIssueRequest({
    journal_id: data.journal_id,
    requested_by: user.id,
    label: serial.label,
    volume: serial.volume,
    issue_no: serial.issue,
    year: serial.year,
  });

  // Notify publisher by email
  const journalRes = await pool.query(
    `SELECT j.title, u.email as publisher_email, u.username as publisher_name
     FROM journals j JOIN users u ON u.id = j.owner_id WHERE j.id = $1`,
    [data.journal_id],
  );
  if (journalRes.rows.length) {
    const { publisher_email, publisher_name, title } = journalRes.rows[0];
    transporter
      .sendMail({
        from: `"Paperuno" <${env.EMAIL_FROM}>`,
        to: publisher_email,
        subject: `New Issue Request — ${title}`,
        html: baseEmailTemplate(
          "New Issue Request",
          `<p>Dear <strong>${publisher_name}</strong>,</p>
         <p><strong>${user.username}</strong> (Journal Manager) has requested a new issue for <strong>"${title}"</strong>.</p>
         <p><strong>Requesting:</strong> ${serial.label} (${serial.year})</p>
         <a href="${env.CORS_ORIGIN || "http://localhost:5173"}/publisher" class="button">Review Request →</a>`,
        ),
      })
      .catch(() => {});
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
  const reqRes = await pool.query(
    `SELECT * FROM issue_requests WHERE id = $1`,
    [request_id],
  );
  if (!reqRes.rows.length) throw new Error("Request not found");
  const req = reqRes.rows[0];

  const updated = await reviewIssueRequest(request_id, action, user.id);

  if (action === "approved") {
    // Always use auto-serial at time of approval (ignores any stored label/volume/issue_no)
    const serial = await getNextIssueSerial(req.journal_id);

    await createJournalIssue(req.journal_id, serial);

    // Notify the journal manager
    const notifyRes = await pool.query(
      `SELECT u.email, u.username FROM users u WHERE u.id = $1`,
      [req.requested_by],
    );
    if (notifyRes.rows.length) {
      const { email, username } = notifyRes.rows[0];
      transporter
        .sendMail({
          from: `"Paperuno" <${env.EMAIL_FROM}>`,
          to: email,
          subject: "Your Issue Request Has Been Approved",
          html: baseEmailTemplate(
            "Issue Request Approved",
            `<p>Dear <strong>${username}</strong>,</p>
           <p>Your issue request has been approved.</p>
           <p><strong>Issue Created:</strong> ${serial.label} (${serial.year})</p>
           <a href="${env.CORS_ORIGIN || "http://localhost:5173"}/journal-manager" class="button">View Issues →</a>`,
          ),
        })
        .catch(() => {});
    }
  }

  return updated;
};
