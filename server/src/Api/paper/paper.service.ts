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
  editPaperMetadataRepo,
  getPublicKeywordSuggestions,
  getJournalTopKeywords,
} from "./paper.repository";
import { createPaperVersion, getPaperVersions, updateVersionHtmlContent } from "../paperVersion/paperVersion.repository";
import { pool } from "../../configs/db";
import { sendSubmissionConfirmationEmail } from "../../utils/emails/paperEmails";
import { extractLatexToHtml } from "../../utils/latexToHtml";

const MAX_PAPERS_PER_ISSUE = 99;

const autoAssignToIssue = async (paperId: string, journalId: string): Promise<void> => {
  // Find first open issue with < 99 papers
  const issueRes = await pool.query(
    `SELECT ji.id, COUNT(p.id)::int AS paper_count
     FROM journal_issues ji
     LEFT JOIN papers p ON p.issue_id = ji.id
     WHERE ji.journal_id = $1 AND ji.status = 'open'
     GROUP BY ji.id
     HAVING COUNT(p.id) < $2
     ORDER BY ji.created_at ASC
     LIMIT 1`,
    [journalId, MAX_PAPERS_PER_ISSUE],
  );

  if (!issueRes.rows.length) return; // no open issue with space — leave unassigned

  const issue = issueRes.rows[0];
  await pool.query(`UPDATE papers SET issue_id = $1, updated_at = NOW() WHERE id = $2`, [issue.id, paperId]);

  const newCount = issue.paper_count + 1;
  if (newCount >= MAX_PAPERS_PER_ISSUE) {
    await pool.query(`UPDATE journal_issues SET status = 'closed', updated_at = NOW() WHERE id = $1`, [issue.id]);
  }
};
export const createPaperService = async (
  data: any,
  authorEmail?: string,
  authorUsername?: string,
) => {
  const paper = await createPaper(data);

  // Grant 'author' role in user_roles so multi-role switcher picks it up.
  // Uses WHERE NOT EXISTS to handle NULL journal_id (ON CONFLICT won't match NULLs).
  await pool.query(
    `INSERT INTO user_roles (user_id, role, journal_id, granted_by, is_active)
     SELECT $1, 'author', NULL, $1, true
     WHERE NOT EXISTS (
       SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'author' AND journal_id IS NULL
     )`,
    [data.author_id],
  );

  // Create version 1 if a manuscript was uploaded
  if (data.manuscript_url) {
    const version = await createPaperVersion(paper.id, data.author_id, {
      version_label: "v1",
      file_url: data.manuscript_url,
      file_size: data.manuscript_size || 0,
      file_type: data.manuscript_type || "application/octet-stream",
    });
    await setCurrentVersion(paper.id, version.id);

    // Option A: extract HTML from .docx/.tex on upload for inline web view
    if (data.manuscript_path) {
      const mPath = data.manuscript_path;
      if (mPath.endsWith(".docx")) {
        try {
          const mammoth = (await import("mammoth")).default;
          const result = await mammoth.convertToHtml({ path: mPath });
          if (result.value) {
            await updateVersionHtmlContent(version.id, result.value);
          }
        } catch {
          // non-fatal
        }
      } else if (mPath.endsWith(".tex") || mPath.endsWith(".latex")) {
        try {
          const html = extractLatexToHtml(mPath);
          if (html && html.length > 50) {
            await updateVersionHtmlContent(version.id, html);
          }
        } catch {
          // non-fatal
        }
      }
    }
  }

  // Auto-assign to first open issue with available slots
  if (data.journal_id) {
    await autoAssignToIssue(paper.id, data.journal_id).catch(() => {});
  }

  if (authorEmail && authorUsername) {
    sendSubmissionConfirmationEmail(authorEmail, authorUsername, paper.title, paper.id).catch(
      (err) => console.error("[email] submission confirmation failed:", err),
    );
  }

  return { ...paper, status: "submitted" };
};

export const getPaperVersionsService = async (paperId: string) => {
  return getPaperVersions(paperId);
};

export const getKeywordSuggestionsService = async (q: string) => {
  return getKeywordSuggestions(q);
};

export const getPublicKeywordSuggestionsService = async (
  q: string | null,
  journalId: string | null,
  limit: number,
) => {
  return getPublicKeywordSuggestions(q, journalId, limit);
};

export const getJournalTopKeywordsService = async (journalId: string, limit: number) => {
  return getJournalTopKeywords(journalId, limit);
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

  const paper = await getPaperById(paper_id);
  if (paper?.status === "published") {
    throw new Error("Cannot change the status of a published paper.");
  }

  return updatePaperStatus(paper_id, status);
};

const parseMetadataFromText = (lines: string[]): {
  title: string;
  abstract: string;
  keywords: string[];
  authors: string[];
  references: string[];
} => {
  const nonEmpty = lines.map(l => l.trim()).filter(l => l.length > 1);

  // Title: first non-empty line that looks like a title (no trailing period, < 200 chars, not all-caps institution)
  let title = "";
  for (const line of nonEmpty.slice(0, 20)) {
    if (line.length < 5 || line.length > 200) continue;
    if (/^https?:\/\//i.test(line)) continue;
    if (/^\d{4}$/.test(line.trim())) continue; // bare year
    title = line;
    break;
  }

  // Abstract
  let abstract = "";
  const absIdx = nonEmpty.findIndex(l => /^abstract\s*[:\-–]?/i.test(l));
  if (absIdx >= 0) {
    const inline = nonEmpty[absIdx].replace(/^abstract\s*[:\-–]?\s*/i, "").trim();
    if (inline.length > 20) {
      abstract = inline;
    } else {
      const chunks: string[] = [];
      for (let i = absIdx + 1; i < nonEmpty.length; i++) {
        if (/^(introduction|keywords?|key\s+words?|index\s+terms?|1\.?\s)/i.test(nonEmpty[i])) break;
        chunks.push(nonEmpty[i]);
        if (chunks.join(" ").length > 800) break;
      }
      abstract = chunks.join(" ");
    }
  }

  // Keywords
  let keywords: string[] = [];
  const kwIdx = nonEmpty.findIndex(l => /^(keywords?|key\s+words?|index\s+terms?)\s*[:\-–]?/i.test(l));
  if (kwIdx >= 0) {
    const inline = nonEmpty[kwIdx].replace(/^(keywords?|key\s+words?|index\s+terms?)\s*[:\-–]?\s*/i, "").trim();
    const src = inline.length > 3 ? inline : (nonEmpty[kwIdx + 1] || "");
    keywords = src.split(/[,;·•]/).map(k => k.trim()).filter(k => k.length > 1 && k.length < 60).slice(0, 5);
  }

  // Authors: lines between title and abstract containing @ or short enough to be names
  let authors: string[] = [];
  const titleLineIdx = nonEmpty.findIndex(l => l === title);
  const absSearchIdx = absIdx >= 0 ? absIdx : nonEmpty.findIndex(l => /^abstract\b/i.test(l));
  if (titleLineIdx >= 0 && absSearchIdx > titleLineIdx + 1) {
    const between = nonEmpty.slice(titleLineIdx + 1, absSearchIdx);
    // prefer lines with @ (author + email) or short name-like lines
    const candidates = between.filter(l =>
      (l.includes("@") || (l.length > 2 && l.length < 100 && !/^\d/.test(l) && !/^(abstract|introduction|keywords?)/i.test(l)))
    );
    authors = candidates
      .map(l => l.replace(/\s*\d+\s*$/, "").replace(/\s*[,;]\s*$/, "").trim())
      .filter(l => l.length > 1)
      .slice(0, 5);
  }

  // References: section near end starting with "References" or "Bibliography"
  let references: string[] = [];
  const refIdx = nonEmpty.findIndex(l => /^(references?|bibliography)\s*$/i.test(l));
  if (refIdx >= 0) {
    const refLines = nonEmpty.slice(refIdx + 1);
    const entries: string[] = [];
    let current = "";
    for (const l of refLines) {
      if (/^(\[\d+\]|\d+[\.\)])\s/.test(l)) {
        if (current) entries.push(current.trim());
        current = l;
      } else if (current) {
        current += " " + l;
      }
      if (entries.length >= 5) break;
    }
    if (current && entries.length < 5) entries.push(current.trim());
    references = entries.slice(0, 5);
    // fallback: just take first 5 non-empty lines after heading
    if (references.length === 0) {
      references = refLines.filter(l => l.length > 10).slice(0, 5);
    }
  }

  return { title, abstract, keywords, authors, references };
};

export const extractMetadataService = async (filePath: string, ext: string): Promise<{
  title: string;
  abstract: string;
  keywords: string[];
  authors: string[];
  references: string[];
}> => {
  if (ext === "pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const fs = (await import("fs")).default;
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const lines = pdfData.text.split(/\r?\n/);
    return parseMetadataFromText(lines);
  }

  // .docx path (existing logic)
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

export const editPaperMetadataService = async (
  paperId: string,
  userId: string,
  userRole: string,
  title?: string,
  abstract?: string,
) => {
  return editPaperMetadataRepo(paperId, userId, userRole, title, abstract);
};

