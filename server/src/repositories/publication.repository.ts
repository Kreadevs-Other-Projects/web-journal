import { pool } from "../configs/db";

export const createPublication = async (
  paper_id: string,
  issue_id: string,
  published_by: string,
  year_label?: string,
) => {
  const result = await pool.query(
    `
    INSERT INTO publications
      (paper_id, issue_id, published_by, year_label)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [paper_id, issue_id, published_by, year_label ?? null],
  );

  return result.rows[0];
};

export const isPaperPublished = async (paper_id: string) => {
  const result = await pool.query(
    `SELECT id FROM publications WHERE paper_id = $1`,
    [paper_id],
  );
  return result.rows.length > 0;
};
