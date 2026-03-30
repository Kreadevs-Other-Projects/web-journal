import {
  createPaperVersion,
  getPaperVersions,
} from "./paperVersion.repository";
import {
  getPaperById,
  setCurrentVersion,
  insertStatusLog,
} from "../paper/paper.repository";
import { pool } from "../../configs/db";
import { transporter } from "../../configs/email";
import { env } from "../../configs/envs";

export const uploadPaperVersionService = async (
  user: any,
  paper_id: string,
  data: {
    version_label: string;
    file_url: string;
    file_size: number;
    file_type: string;
  },
) => {
  if (user.role !== "author") {
    throw new Error("Only authors are allowed to upload paper versions.");
  }

  if (!paper_id) {
    throw new Error("Paper ID is required.");
  }

  const paper = await getPaperById(paper_id);
  if (!paper) {
    throw new Error("The requested paper was not found.");
  }

  if (["accepted", "published"].includes(paper.status)) {
    throw new Error(
      "This paper has already been finalized. You cannot upload new versions.",
    );
  }

  if (paper.status === "rejected") {
    throw new Error(
      "This paper has been rejected. New versions cannot be uploaded.",
    );
  }

  const existingVersions = await getPaperVersions(paper_id);
  if (existingVersions.some((v) => v.version_label === data.version_label)) {
    throw new Error(
      `A version with label "${data.version_label}" already exists.`,
    );
  }

  const version = await createPaperVersion(paper_id, user.id, data);

  await setCurrentVersion(paper_id, version.id);

  // If paper was in pending_revision → mark as resubmitted, reset reviewer decisions, notify team
  if (paper.status === "rejected") {
    await pool.query(
      `UPDATE papers SET status = 'resubmitted', updated_at = NOW() WHERE id = $1`,
      [paper_id],
    );

    await insertStatusLog({
      paper_id,
      status: "resubmitted",
      changed_by: user.id,
      note: `Author uploaded revised version ${version.version_number}`,
    });

    // Reset reviewer assignments so they can re-review the new version
    await pool.query(
      `UPDATE review_assignments SET status = 'assigned', submitted_at = NULL
       WHERE paper_id = $1 AND status = 'submitted'`,
      [paper_id],
    );

    // Notify sub_editor and chief_editor
    const teamRes = await pool.query(
      `SELECT DISTINCT u.email, u.username, u.role
       FROM users u
       WHERE u.id IN (
         SELECT sub_editor_id FROM editor_assignments WHERE paper_id = $1 AND status = 'accepted'
         UNION
         SELECT j.chief_editor_id FROM papers p JOIN journals j ON j.id = p.journal_id WHERE p.id = $1
       )`,
      [paper_id],
    );

    for (const member of teamRes.rows) {
      transporter
        .sendMail({
          from: `"GIKI JournalHub" <${env.EMAIL_FROM}>`,
          to: member.email,
          subject: `Revised Version Uploaded — "${paper.title}"`,
          text: `Hi ${member.username},\n\nThe author has uploaded a revised version (v${version.version_number}) of the paper "${paper.title}".\n\nPlease log in to review the new version.`,
        })
        .catch(() => {});
    }
  }

  return version;
};

export const getPaperVersionsService = async (paper_id: string) => {
  if (!paper_id) {
    throw new Error("Paper ID is required.");
  }

  return getPaperVersions(paper_id);
};
