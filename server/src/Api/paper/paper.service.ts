import {
  createPaper,
  getAllPapers,
  updatePaperStatus,
  getPapersByAuthor,
  insertStatusLog,
  getKeywordSuggestions,
  assignPaperToIssue,
  getPaperById,
  setCurrentVersion,
} from "./paper.repository";
import { createPaperVersion, getPaperVersions } from "../paperVersion/paperVersion.repository";
import { pool } from "../../configs/db";
import { sendSubmissionConfirmationEmail } from "../../utils/emails/paperEmails";

export const createPaperService = async (
  data: any,
  authorEmail?: string,
  authorUsername?: string,
) => {
  const paper = await createPaper(data);

  // Create version 1 if a manuscript was uploaded
  if (data.manuscript_url) {
    const version = await createPaperVersion(paper.id, data.author_id, {
      version_label: "v1",
      file_url: data.manuscript_url,
      file_size: data.manuscript_size || 0,
      file_type: data.manuscript_type || "application/octet-stream",
    });
    await setCurrentVersion(paper.id, version.id);
  }

  await insertStatusLog({
    paper_id: paper.id,
    status: "submitted",
    changed_by: data.author_id,
    note: "Paper submitted",
  });

  if (authorEmail && authorUsername) {
    sendSubmissionConfirmationEmail(authorEmail, authorUsername, paper.title, paper.id).catch(
      () => {},
    );
  }

  return paper;
};

export const getPaperVersionsService = async (paperId: string) => {
  return getPaperVersions(paperId);
};

export const getKeywordSuggestionsService = async (q: string) => {
  return getKeywordSuggestions(q);
};

export const getAllPapersService = async () => getAllPapers();

export const getPapersByAuthorService = async (author_id: string) =>
  getPapersByAuthor(author_id);

export const assignPaperToIssueService = async (
  user: { id: string; role: string; active_journal_id: string | null },
  paperId: string,
  issueId: string,
) => {
  const paper = await getPaperById(paperId);
  if (!paper) throw new Error("Paper not found");

  const issueRes = await pool.query(
    `SELECT ji.id, ji.journal_id, ji.status
     FROM journal_issues ji
     WHERE ji.id = $1`,
    [issueId],
  );
  if (!issueRes.rows.length) throw new Error("Issue not found");

  const issue = issueRes.rows[0];
  if (issue.status === "closed")
    throw new Error("Cannot assign paper to a closed issue");

  if (paper.journal_id !== issue.journal_id)
    throw new Error("Paper does not belong to this journal");

  // For journal_manager, verify they manage this journal
  if (user.role === "journal_manager") {
    const roleCheck = await pool.query(
      `SELECT 1 FROM user_roles
       WHERE user_id = $1 AND role = 'journal_manager' AND journal_id = $2 AND is_active = true`,
      [user.id, issue.journal_id],
    );
    if (!roleCheck.rows.length)
      throw new Error("You do not manage this journal");
  }

  // For chief_editor, verify they are chief_editor of this journal
  if (user.role === "chief_editor") {
    const ceCheck = await pool.query(
      `SELECT 1 FROM journals WHERE id = $1 AND chief_editor_id = $2`,
      [issue.journal_id, user.id],
    );
    if (!ceCheck.rows.length)
      throw new Error("You are not the chief editor of this journal");
  }

  return assignPaperToIssue(paperId, issueId);
};

export const updatePaperStatusService = async (
  user: any,
  paper_id: string,
  status: string,
) => {
  if (!["editor", "owner", "admin"].includes(user.role)) {
    throw new Error("Unauthorized");
  }

  return updatePaperStatus(paper_id, status);
};
