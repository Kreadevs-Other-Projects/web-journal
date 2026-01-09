import { pool } from "../configs/db";

export const createPaper = async (
  data: {
    title: string;
    abstract?: string;
    category?: string;
    keywords?: string[];
    journal_id?: string;
  },
  authorId: string
) => {
  const result = await pool.query(
    `
    INSERT INTO papers (title, abstract, category, keywords, author_id, journal_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      data.title,
      data.abstract,
      data.category,
      data.keywords,
      authorId,
      data.journal_id,
    ]
  );

  return result.rows[0];
};

export const getPaperById = async (paperId: string) => {
  const result = await pool.query(`SELECT * FROM papers WHERE id = $1`, [
    paperId,
  ]);
  return result.rows[0];
};

export const updateCurrentVersion = async (
  paperId: string,
  versionId: string
) => {
  await pool.query(
    `
    UPDATE papers
    SET current_version = $1, updated_at = NOW()
    WHERE id = $2
    `,
    [versionId, paperId]
  );
};
