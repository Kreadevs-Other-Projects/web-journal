import { pool } from "../configs/db";

export const createPaperVersion = async (
  paper_id: string,
  uploaded_by: string,
  data: any,
) => {
  const last = await pool.query(
    `
    SELECT COALESCE(MAX(version_number), 0) AS last
    FROM paper_versions
    WHERE paper_id = $1
    `,
    [paper_id],
  );

  const nextVersion = last.rows[0].last + 1;

  const result = await pool.query(
    `
    INSERT INTO paper_versions
    (paper_id, version_number, version_label, file_url, file_size, file_type, uploaded_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
    `,
    [
      paper_id,
      nextVersion,
      data.version_label,
      data.file_url,
      data.file_size,
      data.file_type,
      uploaded_by,
    ],
  );

  return result.rows[0];
};

export const getPaperVersions = async (paper_id: string) => {
  const result = await pool.query(
    `
    SELECT * FROM paper_versions
    WHERE paper_id = $1
    ORDER BY version_number DESC
    `,
    [paper_id],
  );

  return result.rows;
};
