import { pool } from "../configs/db";
import { publishPaper } from "../repositories/publication.repository";

export const setPaperPublished = async (paperId: string, editorId: string) => {
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
    throw new Error("Editor decision must be accepted before publishing");
  }

  return publishPaper(paperId, editorId);
};
