import * as repo from "./subEditor.repository";
import {
  sendReviewerInviteEmail,
  sendWelcomeEmail,
} from "../../utils/emails/userEmails";
import { pool } from "../../configs/db";
import { transporter } from "../../configs/email";
import { env } from "../../configs/envs";
import { baseEmailTemplate } from "../../utils/emails/baseEmailTemplate";
import bcrypt from "bcrypt";

export const fetchSubEditorPapers = async (subEditorId: string) => {
  return repo.getSubEditorPapers(subEditorId);
};

export const getReviewer = async () => {
  return repo.findReviewer();
};

export const assignReviewer = async (
  paperId: string,
  reviewerId: string,
  assignedBy: string,
) => {
  const { rows } = await pool.query("SELECT status FROM papers WHERE id = $1", [
    paperId,
  ]);
  if (rows[0]?.status === "published") {
    throw new Error("Cannot change the status of a published paper.");
  }
  const assignment = await repo.assignReviewer(paperId, reviewerId, assignedBy);
  return assignment;
};

export const setSubEditorPaperStatus = async (
  paperId: string,
  status: string,
) => {
  const { rows } = await pool.query("SELECT status FROM papers WHERE id = $1", [
    paperId,
  ]);
  if (rows[0]?.status === "published") {
    throw new Error("Cannot change the status of a published paper.");
  }
  return repo.updatePaperStatusSubEditor(paperId, status);
};

export const fetchAssignedReviewers = async (paperId: string) => {
  return repo.getAssignedReviewers(paperId);
};

export const sendInviteEmailReviewer = async (email: string) => {
  const signupLink = `${process.env.CORS_ORIGIN}/signup`;

  await sendReviewerInviteEmail(email, signupLink);

  return { email, signupLink };
};

export const getReviewsForPaperService = async (paperId: string) => {
  return repo.getReviewsForPaper(paperId);
};

export const subEditorDecisionService = async (
  subEditorId: string,
  subEditorEmail: string,
  password: string,
  paperId: string,
  action: "approve" | "revision",
  comments?: string,
) => {
  // Credential verification
  const userRes = await pool.query(
    `SELECT * FROM users WHERE id = $1 AND email = $2`,
    [subEditorId, subEditorEmail],
  );
  if (!userRes.rows.length) {
    throw new Error("Email does not match your account");
  }
  const passwordValid = await bcrypt.compare(
    password,
    userRes.rows[0].password,
  );
  if (!passwordValid) {
    throw new Error("Incorrect password");
  }

  // Get current paper version and status
  const paperInfo = await pool.query(
    "SELECT current_version_id, status, ce_override FROM papers WHERE id = $1",
    [paperId],
  );
  if (paperInfo.rows[0]?.status === "published") {
    throw new Error("Cannot change the status of a published paper.");
  }
  if (paperInfo.rows[0]?.ce_override) {
    throw new Error("This paper's status has been overridden by the Chief Editor and cannot be changed.");
  }
  const currentVersionId = paperInfo.rows[0]?.current_version_id;

  // Block duplicate decision on the same version
  const existingDecision = await pool.query(
    `SELECT id, decision, decided_at
     FROM sub_editor_decisions
     WHERE paper_id = $1 AND sub_editor_id = $2 AND paper_version_id = $3`,
    [paperId, subEditorId, currentVersionId],
  );
  if (existingDecision.rows.length > 0) {
    const d = existingDecision.rows[0];
    throw new Error(
      `You have already submitted a decision (${d.decision}) for this version on ${new Date(d.decided_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}. A new decision can only be made after the author uploads a revised version.`,
    );
  }

  if (action === "revision" && !comments?.trim()) {
    throw new Error(
      `Comments are required when requesting ${action === "revision" ? "a revision" : "rejection"}.`,
    );
  }

  const paper = await repo.subEditorDecision(
    paperId,
    subEditorId,
    action,
    comments,
  );

  // Email notifications to author
  const authorRes = await pool.query(
    `SELECT u.email, u.username, p.title FROM papers p JOIN users u ON u.id = p.author_id WHERE p.id = $1`,
    [paperId],
  );

  if (authorRes.rows.length) {
    const { email, username, title } = authorRes.rows[0];

    if (action === "revision") {
      transporter
        .sendMail({
          from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
          to: email,
          subject: `Revision Required — "${title}"`,
          html: baseEmailTemplate(
            "Revision Required",
            `<p>Dear <strong>${username}</strong>,</p>
             <p>Your paper <strong>"${title}"</strong> has been reviewed by our Associate Editor.</p>
             <p><strong>Decision:</strong> Revision Required</p>
             ${comments ? `<p><strong>Associate Editor Comments:</strong></p><p style="background:#0B1220;padding:12px;border-radius:8px;border-left:3px solid #2563EB;">${comments}</p>` : ""}
             <p>Please log in and upload a revised version of your paper to continue the review process.</p>
             <a href="${env.CORS_ORIGIN || "http://localhost:5173"}/author" class="button">Submit Revision →</a>`,
          ),
        })
        .catch(() => {});
    } else {
      transporter
        .sendMail({
          from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
          to: email,
          subject: `Paper Decision — "${title}"`,
          html: baseEmailTemplate(
            "Paper Decision",
            `<p>Dear <strong>${username}</strong>,</p>
             <p>Your paper <strong>"${title}"</strong> has been reviewed by our Associate Editor.</p>
             <p><strong>Decision:</strong> Revision Required</p>
             ${comments ? `<p><strong>Associate Editor Comments:</strong></p><p style="background:#0B1220;padding:12px;border-radius:8px;border-left:3px solid #2563EB;">${comments}</p>` : ""}
             <p>Thank you for your submission. You are welcome to submit to a future issue.</p>
             <a href="${env.CORS_ORIGIN || "http://localhost:5173"}/author" class="button">View Submission →</a>`,
          ),
        })
        .catch(() => {});
    }
  }

  return paper;
};

// ---- Reviewer Requests ----

export const getExistingDecisionService = async (
  paperId: string,
  subEditorId: string,
) => {
  return repo.getExistingSubEditorDecision(paperId, subEditorId);
};

export const suggestReviewerService = async (
  subEditorId: string,
  paperId: string,
  data: {
    suggested_name: string;
    suggested_email: string;
    keywords?: string[];
    degrees?: string[];
  },
) => {
  const request = await repo.createReviewerRequest({
    ...data,
    paper_id: paperId,
    sub_editor_id: subEditorId,
  });

  // Notify chief editor by email
  const ceRes = await pool.query(
    `SELECT u.email, u.username, p.title as paper_title
     FROM papers p
     JOIN journals j ON j.id = p.journal_id
     JOIN users u ON u.id = j.chief_editor_id
     WHERE p.id = $1`,
    [paperId],
  );
  if (ceRes.rows.length) {
    const { email, username, paper_title } = ceRes.rows[0];
    const subRes = await pool.query(
      `SELECT username FROM users WHERE id = $1`,
      [subEditorId],
    );
    const subName = subRes.rows[0]?.username || "Sub Editor";
    transporter
      .sendMail({
        from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
        to: email,
        subject: `Reviewer Suggestion for "${paper_title}"`,
        html: baseEmailTemplate(
          "New Reviewer Suggestion",
          `<p>Dear <strong>${username}</strong>,</p>
           <p><strong>${subName}</strong> has suggested a reviewer for <strong>"${paper_title}"</strong>.</p>
           <p><strong>Suggested Reviewer:</strong> ${data.suggested_name} &lt;${data.suggested_email}&gt;</p>
           ${data.keywords?.length ? `<p><strong>Keywords:</strong> ${data.keywords.join(", ")}</p>` : ""}
           <p>Please log in to approve or reject this suggestion.</p>
           <a href="${env.CORS_ORIGIN || "http://localhost:5173"}/chief-editor" class="button">Review Suggestion →</a>`,
        ),
      })
      .catch(() => {});
  }

  return request;
};

export const getPendingReviewerRequestsService = async (
  chiefEditorId: string,
) => {
  return repo.getPendingReviewerRequestsForCE(chiefEditorId);
};

export const reviewReviewerRequestService = async (
  user: { id: string },
  requestId: string,
  action: "approved" | "rejected",
) => {
  const reqRes = await pool.query(
    `SELECT * FROM reviewer_requests WHERE id = $1`,
    [requestId],
  );
  if (!reqRes.rows.length) throw new Error("Request not found");
  const req = reqRes.rows[0];

  const updated = await repo.reviewReviewerRequest(requestId, action, user.id);

  if (action === "approved") {
    const tempPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.hash(
      tempPassword,
      Number(env.SALT_ROUND),
    );

    const newUserRes = await pool.query(
      `INSERT INTO users (username, email, password, role, status)
       VALUES ($1, $2, $3, 'reviewer', 'active')
       ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
       RETURNING *`,
      [req.suggested_name, req.suggested_email, hashedPassword],
    );
    const newUser = newUserRes.rows[0];

    // Assign to paper
    await pool.query(
      `INSERT INTO review_assignments (paper_id, reviewer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.paper_id, newUser.id],
    );

    // Ensure reviewer role is tracked in user_roles for this journal
    const paperJRes = await pool.query(
      `SELECT journal_id FROM papers WHERE id = $1`,
      [req.paper_id],
    );
    const reqJournalId = paperJRes.rows[0]?.journal_id;
    if (reqJournalId) {
      await pool.query(
        `INSERT INTO user_roles (user_id, role, journal_id, granted_by, is_active)
         VALUES ($1, 'reviewer', $2, $3, true)
         ON CONFLICT (user_id, role, journal_id) DO UPDATE SET is_active = true`,
        [newUser.id, reqJournalId, user.id],
      );
    }

    // Send welcome email
    sendWelcomeEmail(
      req.suggested_email,
      req.suggested_name,
      tempPassword,
    ).catch(() => {});

    // Notify sub editor
    const seRes = await pool.query(
      `SELECT email, username FROM users WHERE id = $1`,
      [req.sub_editor_id],
    );
    if (seRes.rows.length) {
      transporter
        .sendMail({
          from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
          to: seRes.rows[0].email,
          subject: "Your Reviewer Suggestion Has Been Approved",
          html: baseEmailTemplate(
            "Reviewer Suggestion Approved",
            `<p>Dear <strong>${seRes.rows[0].username}</strong>,</p>
             <p>Your suggestion for reviewer <strong>"${req.suggested_name}"</strong> has been approved and they have been assigned to the paper.</p>`,
          ),
        })
        .catch(() => {});
    }
  }

  return updated;
};
