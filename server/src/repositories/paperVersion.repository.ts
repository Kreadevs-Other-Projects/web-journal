import { pool } from "../configs/db";

export const createPaperVersionRepo = async (data: any, userId: string) => {
  const result = await pool.query(
    `
    INSERT INTO paper_versions (paper_id, version_label, file_url, uploaded_by)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [data.paper_id, data.version_label, data.file_url, userId]
  );

  return result.rows[0];
};

export const getPaperVersionsRepo = async (paperId: string) => {
  const result = await pool.query(
    `
    SELECT *
    FROM paper_versions
    WHERE paper_id = $1
    ORDER BY created_at DESC
    `,
    [paperId]
  );

  return result.rows;
};
