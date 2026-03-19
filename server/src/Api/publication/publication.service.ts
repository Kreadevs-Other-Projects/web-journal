import { pool } from "../../configs/db";
import { getPaperForPublish, publishPaper } from "./publication.repository";
import { generateFormatsService } from "./formats.service";

export const getSubmittedReviews = async () => {
  return getPaperForPublish();
};

export const setPaperPublished = async (
  paperId: string,
  editorId: string,
  issueId: string,
  doi: string,
) => {
  if (!doi || !doi.trim()) {
    throw new Error("DOI is required before publication");
  }

  const paperRes = await pool.query(`SELECT status FROM papers WHERE id = $1`, [
    paperId,
  ]);

  if (!paperRes.rows.length) {
    throw new Error("Paper not found");
  }

  if (paperRes.rows[0].status === "published") {
    throw new Error("Paper already published");
  }

  if (paperRes.rows[0].status !== "accepted") {
    throw new Error("Paper must be accepted before publishing");
  }

  const decisionRes = await pool.query(
    `SELECT decision FROM editor_decisions WHERE paper_id = $1`,
    [paperId],
  );

  if (!decisionRes.rows.length) {
    throw new Error("Editor decision not found");
  }

  if (decisionRes.rows[0].decision !== "accepted") {
    throw new Error("Editor decision must be accept before publishing");
  }

  const publication = await publishPaper(paperId, editorId, issueId, doi);
  // Trigger format generation in background (non-blocking)
  generateFormatsService(paperId, publication.id).catch(() => {});
  return publication;
};
