import { pool } from "../../configs/db";
import { env } from "../../configs/envs";
import {
  sendReviewerApplicationToEditor,
  sendReviewerApplicationConfirmation,
} from "../../utils/emails/reviewerApplicationEmail";

export const applyAsReviewerService = async (data: {
  journalId: string;
  name: string;
  email: string;
  degrees: string[];
  keywords: string[];
  statement?: string;
  affiliation?: string;
  orcid?: string;
  profilePicPath?: string;
}) => {
  // 1. Get journal name
  const journalRes = await pool.query(
    `SELECT title FROM journals WHERE id = $1`,
    [data.journalId],
  );
  if (!journalRes.rows.length) throw new Error("Journal not found");
  const journalName = journalRes.rows[0].title;

  // 2. Find chief editor of this journal
  const editorRes = await pool.query(
    `SELECT u.email, u.username
     FROM users u
     JOIN user_roles ur ON ur.user_id = u.id
     WHERE ur.journal_id = $1 AND ur.role = 'chief_editor' AND ur.is_active = true
     LIMIT 1`,
    [data.journalId],
  );

  let editorEmail: string;
  let editorName: string;

  if (editorRes.rows.length) {
    editorEmail = editorRes.rows[0].email;
    editorName = editorRes.rows[0].username;
  } else {
    // Fallback: publisher email
    const publisherRes = await pool.query(
      `SELECT u.email, u.username
       FROM users u
       WHERE u.role = 'publisher'
       LIMIT 1`,
    );
    if (!publisherRes.rows.length) throw new Error("No editorial contact found for this journal");
    editorEmail = publisherRes.rows[0].email;
    editorName = publisherRes.rows[0].username;
  }

  const submittedAt = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const frontendUrl = env.CORS_ORIGIN || "http://localhost:5173";

  // 3. Store application in DB
  const profilePicUrl = data.profilePicPath
    ? `uploads/profiles/${data.profilePicPath.split(/[\\/]/).pop()}`
    : null;

  const appRes = await pool.query(
    `INSERT INTO reviewer_applications
       (journal_id, name, email, profile_pic_url, degrees, keywords, statement, affiliation, orcid)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      data.journalId,
      data.name,
      data.email,
      profilePicUrl,
      data.degrees,
      data.keywords,
      data.statement || null,
      data.affiliation || null,
      data.orcid || null,
    ],
  );
  const applicationId = appRes.rows[0].id;

  // 4. Send email to chief editor
  await sendReviewerApplicationToEditor(editorEmail, editorName, {
    journalName,
    applicantName: data.name,
    applicantEmail: data.email,
    affiliation: data.affiliation,
    orcid: data.orcid,
    degrees: data.degrees,
    keywords: data.keywords,
    statement: data.statement,
    profilePicPath: data.profilePicPath,
    submittedAt,
    dashboardLink: `${frontendUrl}/chief-editor/applications?journal=${data.journalId}`,
  }, frontendUrl);

  // 5. Send confirmation to applicant
  await sendReviewerApplicationConfirmation(data.email, data.name, journalName, submittedAt);

  return { journalName, applicationId };
};
