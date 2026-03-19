import * as repo from "./subEditor.repository";
import { sendReviewerInviteEmail } from "../../utils/emails/userEmails";

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
  const assignment = await repo.assignReviewer(paperId, reviewerId, assignedBy);
  return assignment;
};

export const setSubEditorPaperStatus = async (
  paperId: string,
  status: string,
) => {
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

// ---- Reviewer Requests ----

export const suggestReviewerService = async (
  subEditorId: string,
  paperId: string,
  data: { suggested_name: string; suggested_email: string; keywords?: string[]; degrees?: string[] },
) => {
  const request = await repo.createReviewerRequest({
    ...data,
    paper_id: paperId,
    sub_editor_id: subEditorId,
  });

  // Notify chief editor by email
  const { pool } = await import("../../configs/db");
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
    const subRes = await pool.query(`SELECT username FROM users WHERE id = $1`, [subEditorId]);
    const subName = subRes.rows[0]?.username || "Sub Editor";
    const { transporter } = await import("../../configs/email");
    const { env } = await import("../../configs/envs");
    transporter.sendMail({
      from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
      to: email,
      subject: `Reviewer Suggestion for "${paper_title}"`,
      text: `Hi ${username},\n\n${subName} has suggested a reviewer for "${paper_title}".\n\nSuggested reviewer: ${data.suggested_name} <${data.suggested_email}>\nKeywords: ${(data.keywords || []).join(", ")}\n\nPlease log in to approve or reject this suggestion.`,
    }).catch(() => {});
  }

  return request;
};

export const getPendingReviewerRequestsService = async (chiefEditorId: string) => {
  return repo.getPendingReviewerRequestsForCE(chiefEditorId);
};

export const reviewReviewerRequestService = async (
  user: { id: string },
  requestId: string,
  action: "approved" | "rejected",
) => {
  const { pool } = await import("../../configs/db");
  const reqRes = await pool.query(`SELECT * FROM reviewer_requests WHERE id = $1`, [requestId]);
  if (!reqRes.rows.length) throw new Error("Request not found");
  const req = reqRes.rows[0];

  const updated = await repo.reviewReviewerRequest(requestId, action, user.id);

  if (action === "approved") {
    // Create the reviewer user account and assign to paper
    const bcrypt = await import("bcrypt");
    const { env } = await import("../../configs/envs");
    const tempPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await bcrypt.default.hash(tempPassword, Number(env.SALT_ROUND));

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

    // Send welcome email
    const { sendWelcomeEmail } = await import("../../utils/emails/userEmails");
    sendWelcomeEmail(req.suggested_email, req.suggested_name, tempPassword).catch(() => {});

    // Notify sub editor
    const seRes = await pool.query(`SELECT email, username FROM users WHERE id = $1`, [req.sub_editor_id]);
    if (seRes.rows.length) {
      const { transporter } = await import("../../configs/email");
      const { env: envConfig } = await import("../../configs/envs");
      transporter.sendMail({
        from: `"GIKI JournalHub" <${envConfig.EMAIL_FROM}>`,
        to: seRes.rows[0].email,
        subject: "Your Reviewer Suggestion Has Been Approved",
        text: `Hi ${seRes.rows[0].username},\n\nYour suggestion for reviewer "${req.suggested_name}" has been approved and they have been assigned to the paper.`,
      }).catch(() => {});
    }
  }

  return updated;
};
