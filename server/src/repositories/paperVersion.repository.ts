import { pool } from "../configs/db";

export const createPaperVersion = async (
  paper_id: string,
  uploaded_by: string,
  data: any,
) => {
  const { version_label, file_url } = data;

  const result = await pool.query(
    `
    INSERT INTO paper_versions
    (paper_id, version_label, file_url, uploaded_by)
    VALUES ($1,$2,$3,$4)
    RETURNING *
    `,
    [paper_id, version_label, file_url, uploaded_by],
  );

  return result.rows[0];
};

export const getPaperVersions = async (paper_id: string) => {
  const result = await pool.query(
    `
    SELECT * FROM paper_versions
    WHERE paper_id = $1
    ORDER BY created_at DESC
    `,
    [paper_id],
  );
  return result.rows;
};
