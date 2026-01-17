import { pool } from "../configs/db";

export const assignEditor = async (
  paper_id: string,
  sub_editor_id: string,
  assigned_by: string,
) => {
  const result = await pool.query(
    `
    INSERT INTO paper_editor_assignments
    (paper_id, sub_editor_id, assigned_by)
    VALUES ($1,$2,$3)
    RETURNING *
    `,
    [paper_id, sub_editor_id, assigned_by],
  );

  return result.rows[0];
};

export const getEditorAssignment = async (paper_id: string) => {
  const result = await pool.query(
    `SELECT * FROM paper_editor_assignments WHERE paper_id = $1`,
    [paper_id],
  );
  return result.rows[0];
};
