import { pool } from "../../configs/db";
import { getPaperForPublish, publishPaper } from "./publication.repository";
import { generateFormatsService } from "./formats.service";
import { registerDoiWithCrossref } from "../../utils/crossref";

function generateDOI(
  journalAcronym: string,
  year: number,
  articleIndex: number,
): string {
  const prefix = process.env.DOI_PREFIX || "10.12345";
  const acronym = journalAcronym.toLowerCase().replace(/[^a-z0-9]/g, "");
  const index = String(articleIndex).padStart(3, "0");
  return `${prefix}/${acronym}.${year}.${index}`;
}

export const suggestDoiService = async (paperId: string): Promise<string> => {
  const paperRes = await pool.query(
    `SELECT p.journal_id, j.acronym
     FROM papers p
     JOIN journals j ON j.id = p.journal_id
     WHERE p.id = $1`,
    [paperId],
  );

  if (!paperRes.rows.length) throw new Error("Paper not found");

  const { journal_id, acronym } = paperRes.rows[0];

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS cnt
     FROM publications
     WHERE issue_id IN (SELECT id FROM journal_issues WHERE journal_id = $1)`,
    [journal_id],
  );

  const nextIndex = (countRes.rows[0].cnt as number) + 1;
  const year = new Date().getFullYear();

  return generateDOI(acronym || "jnl", year, nextIndex);
};

export const getSubmittedReviews = async (ownerId: string) => {
  return getPaperForPublish(ownerId);
};

export const setPaperPublished = async (
  paperId: string,
  editorId: string,
  issueId: string,
  doi: string,
) => {
  const paperRes = await pool.query(
    `SELECT p.status, p.title, p.abstract, p.keywords, p.author_details, p.issue_id,
            ji.volume, ji.year
     FROM papers p
     LEFT JOIN journal_issues ji ON ji.id = $2
     WHERE p.id = $1`,
    [paperId, issueId],
  );

  if (!paperRes.rows.length) {
    throw new Error("Paper not found");
  }

  const paper = paperRes.rows[0];

  if (paper.status === "published") {
    throw new Error("Paper already published");
  }

  if (paper.status !== "ready_for_publication") {
    throw new Error("Paper must be ready before publishing");
  }

  // ✅ Mandatory metadata validation gate (TRD Section 8A)
  const validationErrors: string[] = [];
  if (!paper.title?.trim()) validationErrors.push("Article title is required");
  if (!paper.abstract?.trim()) validationErrors.push("Abstract is required");
  const kws = Array.isArray(paper.keywords) ? paper.keywords : (typeof paper.keywords === "string" ? JSON.parse(paper.keywords || "[]") : []);
  if (!kws.length) validationErrors.push("At least one keyword is required");
  const authors = Array.isArray(paper.author_details) ? paper.author_details : (typeof paper.author_details === "string" ? JSON.parse(paper.author_details || "[]") : []);
  if (!authors.length) validationErrors.push("Author details are required");
  if (!paper.issue_id && !issueId) validationErrors.push("Paper must be assigned to an issue");
  if (!doi?.trim()) validationErrors.push("DOI is required before publication");
  if (!paper.volume) validationErrors.push("Issue volume is required");
  if (!paper.year) validationErrors.push("Issue year is required");

  if (validationErrors.length > 0) {
    const err: any = new Error("Publication blocked: mandatory metadata missing");
    err.statusCode = 400;
    err.validation_errors = validationErrors;
    throw err;
  }

  // ✅ Payment check
  const paymentRes = await pool.query(
    `SELECT status FROM paper_payments WHERE paper_id = $1`,
    [paperId],
  );

  if (!paymentRes.rows.length) {
    throw new Error("Payment record not found");
  }

  if (paymentRes.rows[0].status !== "success") {
    throw new Error("Payment must be completed before publishing");
  }

  const publication = await publishPaper(paperId, editorId, issueId, doi);
  // Trigger format generation in background (non-blocking)
  generateFormatsService(paperId, publication.id).catch(() => {});

  // Register DOI with Crossref (non-blocking)
  pool.query(
    `SELECT p.title, p.abstract, p.author_details, p.keywords,
            j.name AS journal_title, j.acronym, j.issn,
            ji.volume, ji.issue_number,
            pub.doi
     FROM publications pub
     JOIN papers p ON p.id = pub.paper_id
     JOIN journal_issues ji ON ji.id = pub.issue_id
     JOIN journals j ON j.id = ji.journal_id
     WHERE pub.id = $1`,
    [publication.id],
  ).then(({ rows }) => {
    if (!rows.length) return;
    const r = rows[0];
    const authors = Array.isArray(r.author_details)
      ? r.author_details
      : JSON.parse(r.author_details || "[]");
    const pubUrl = `${process.env.CORS_ORIGIN || "https://gikijournal.edu.pk"}/articles/${paperId}`;
    return registerDoiWithCrossref({
      doi: r.doi,
      title: r.title,
      authors,
      journalTitle: r.journal_title,
      journalAcronym: r.acronym,
      issn: r.issn,
      volume: r.volume,
      issue: r.issue_number,
      year: new Date().getFullYear(),
      url: pubUrl,
    });
  }).catch(() => {});

  return publication;
};
