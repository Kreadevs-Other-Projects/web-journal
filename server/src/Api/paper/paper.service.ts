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
  getPaperTracking,
  getPaperMetadata,
} from "./paper.repository";
import { createPaperVersion, getPaperVersions, updateVersionHtmlContent } from "../paperVersion/paperVersion.repository";
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

    // Option A: extract HTML from .docx on upload for inline web view
    if (data.manuscript_path && data.manuscript_path.endsWith(".docx")) {
      try {
        const mammoth = (await import("mammoth")).default;
        const result = await mammoth.convertToHtml({ path: data.manuscript_path });
        if (result.value) {
          await updateVersionHtmlContent(version.id, result.value);
        }
      } catch {
        // non-fatal — paper is still saved, just no inline view
      }
    }
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

export const extractMetadataService = async (filePath: string): Promise<{
  title: string;
  abstract: string;
  keywords: string[];
  authors: string[];
  references: string[];
}> => {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.convertToHtml({ path: filePath });
  const html = result.value;

  const stripTags = (s: string) =>
    s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

  const blocks: Array<{ level: number; text: string }> = [];
  const re = /<(h[1-6]|p)[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    const text = stripTags(m[2]);
    if (text.length < 2) continue;
    blocks.push({ level: tag === "p" ? 0 : parseInt(tag[1]), text });
  }

  // Title: first heading h1-h3, else first block
  const firstHeading = blocks.find(b => b.level >= 1 && b.level <= 3);
  const title = firstHeading?.text || blocks[0]?.text || "";

  // Abstract
  let abstract = "";
  const absIdx = blocks.findIndex(b => /^abstract\b/i.test(b.text));
  if (absIdx >= 0) {
    const raw = blocks[absIdx].text.replace(/^abstract\s*[:\-–]?\s*/i, "").trim();
    abstract = raw.length > 20 ? raw : (blocks[absIdx + 1]?.text || "");
  }

  // Keywords
  let keywords: string[] = [];
  const kwIdx = blocks.findIndex(b => /^key[\s-]?words?\b/i.test(b.text));
  if (kwIdx >= 0) {
    const raw = blocks[kwIdx].text.replace(/^key[\s-]?words?\s*[:\-–]?\s*/i, "").trim();
    const src = raw.length > 3 ? raw : (blocks[kwIdx + 1]?.text || "");
    keywords = src.split(/[,;·•]/).map(k => k.trim()).filter(k => k.length > 1 && k.length < 60).slice(0, 5);
  }

  // Authors: blocks between title and abstract
  let authors: string[] = [];
  const titleIdx = blocks.findIndex(b => b.text === title);
  const absSearchIdx = absIdx >= 0 ? absIdx : blocks.findIndex(b => /^abstract\b/i.test(b.text));
  if (titleIdx >= 0 && absSearchIdx > titleIdx + 1) {
    authors = blocks.slice(titleIdx + 1, absSearchIdx)
      .filter(b => b.text.length > 2 && b.text.length < 150 && !/^(abstract|introduction|keywords?)/i.test(b.text))
      .map(b => b.text)
      .slice(0, 5);
  }

  // References
  let references: string[] = [];
  const refIdx = blocks.findIndex(b => /^(references?|bibliography)\s*$/i.test(b.text));
  if (refIdx >= 0) {
    references = blocks.slice(refIdx + 1, refIdx + 20)
      .filter(b => b.text.length > 10)
      .map(b => b.text)
      .slice(0, 5);
  }

  return { title, abstract, keywords, authors, references };
};

export const getPaperTrackingService = async (paperId: string, authorId: string) => {
  const data = await getPaperTracking(paperId, authorId);
  if (!data) throw new Error("Paper not found or access denied");
  return data;
};

export const getPaperMetadataCheckService = async (paperId: string) => {
  const paper = await getPaperMetadata(paperId);
  if (!paper) throw new Error("Paper not found");

  const checks: Record<string, boolean> = {
    title: !!(paper.title?.trim()),
    authors: Array.isArray(paper.author_names) && paper.author_names.filter((a: string) => a.trim()).length > 0,
    abstract: !!(paper.abstract?.trim()),
    keywords: Array.isArray(paper.keywords) && paper.keywords.length > 0,
    references: (() => {
      try {
        const refs = typeof paper.paper_references === "string"
          ? JSON.parse(paper.paper_references)
          : paper.paper_references;
        return Array.isArray(refs) && refs.filter((r: any) => r.text?.trim()).length > 0;
      } catch { return false; }
    })(),
    journal_title: !!(paper.journal_title?.trim()),
    volume: paper.volume != null,
    issue: paper.issue != null,
    doi: !!(paper.doi?.trim()),
    publication_date: !!(paper.publication_date),
  };

  const missing_fields = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);

  return {
    valid: missing_fields.length === 0,
    missing_fields,
    paper,
  };
};
