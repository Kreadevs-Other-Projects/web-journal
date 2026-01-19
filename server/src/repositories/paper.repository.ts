import { pool } from "../configs/db";

export const createPaper = async (author_id: string, data: any) => {
  const { title, abstract, category, keywords, journal_id } = data;

  const result = await pool.query(
    `
    INSERT INTO papers
    (title, abstract, category, keywords, author_id, journal_id)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
    `,
    [title, abstract, category, keywords, author_id, journal_id],
  );

  return result.rows[0];
};

export const getAllPapers = async () => {
  const result = await pool.query(
    `SELECT * FROM papers ORDER BY created_at DESC`,
  );
  return result.rows;
};

export const updatePaperStatus = async (paper_id: string, status: string) => {
  const result = await pool.query(
    `
    UPDATE papers
    SET status = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [paper_id, status],
  );
  return result.rows[0];
};

export const setCurrentVersion = async (
  paper_id: string,
  version_id: string,
) => {
  await pool.query(
    `
    UPDATE papers
    SET current_version = $2
    WHERE id = $1
    `,
    [paper_id, version_id],
  );
};
