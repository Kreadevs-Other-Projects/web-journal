import { pool } from "../configs/db";
import {
  createPublication,
  isPaperPublished,
} from "../repositories/publication.repository";

export const publishPaperService = async (
  user: { id: string; role: string },
  paper_id: string,
  issue_id: string,
  year_label?: string,
) => {
  if (!["owner", "editor"].includes(user.role)) {
    throw new Error("Only owner or editor can publish papers");
  }

  const paperRes = await pool.query(`SELECT status FROM papers WHERE id = $1`, [
    paper_id,
  ]);

  if (!paperRes.rows[0]) {
    throw new Error("Paper not found");
  }

  if (paperRes.rows[0].status !== "accepted") {
    throw new Error("Only accepted papers can be published");
  }

  const published = await isPaperPublished(paper_id);
  if (published) {
    throw new Error("Paper already published");
  }

  const publication = await createPublication(
    paper_id,
    issue_id,
    user.id,
    year_label,
  );

  await pool.query(
    `UPDATE papers
     SET status = 'published', updated_at = NOW()
     WHERE id = $1`,
    [paper_id],
  );

  return publication;
};
