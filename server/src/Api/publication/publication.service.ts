import { pool } from "../../configs/db";
import { getPaperForPublish, publishPaper } from "./publication.repository";
import { generateFormatsService } from "./formats.service";

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
  const paperRes = await pool.query(`SELECT status FROM papers WHERE id = $1`, [
    paperId,
  ]);

  if (!paperRes.rows.length) {
    throw new Error("Paper not found");
  }

  if (paperRes.rows[0].status === "published") {
    throw new Error("Paper already published");
  }

  if (paperRes.rows[0].status !== "ready_for_publication") {
    throw new Error("Paper must be ready before publishing");
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
  return publication;
};
