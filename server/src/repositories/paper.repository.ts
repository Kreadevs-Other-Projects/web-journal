import { pool } from "../configs/db";

export const createPaper = async (data: {
  title: string;
  abstract: string;
  category?: string;
  keywords: string[];
  journal_id: string;
  author_id: string;
  issue_id?: string;
}) => {
  const {
    title,
    abstract,
    category,
    keywords,
    journal_id,
    author_id,
    issue_id,
  } = data;

  const result = await pool.query(
    `INSERT INTO papers 
      (title, abstract, category, keywords, journal_id, author_id, issue_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      title,
      abstract,
      category,
      keywords,
      journal_id,
      author_id,
      issue_id || null,
    ],
  );

  return result.rows[0];
};

export const getPaperById = async (id: string) => {
  const result = await pool.query(`SELECT * FROM papers WHERE id = $1`, [id]);
  return result.rows[0];
};

export const getAllPapers = async () => {
  const result = await pool.query(`SELECT * FROM papers`);
  return result.rows;
};

export const getPapersByAuthor = async (author_id: string) => {
  const result = await pool.query(`SELECT * FROM papers WHERE author_id = $1`, [
    author_id,
  ]);
  return result.rows;
};

export const updatePaperStatus = async (paper_id: string, status: string) => {
  const result = await pool.query(
    `
    UPDATE papers
    SET status = $1,
        accepted_at = CASE WHEN $1 = 'accepted' THEN NOW() ELSE accepted_at END,
        published_at = CASE WHEN $1 = 'published' THEN NOW() ELSE published_at END,
        updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    [status, paper_id],
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
    SET current_version_id = $1,
        updated_at = NOW()
    WHERE id = $2
    `,
    [version_id, paper_id],
  );
};
