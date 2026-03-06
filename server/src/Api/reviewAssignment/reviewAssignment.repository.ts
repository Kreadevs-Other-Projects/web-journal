import { pool } from "../../configs/db";

export const getReviewAssignmentsBySubEditor = async (subEditorId: string) => {
  const result = await pool.query(
    `
    SELECT
      ra.id AS review_assignment_id,
      ra.status AS assignment_status,
      r.id AS review_id,
      r.decision,
      r.comments,
      p.id AS paper_id,
      p.title AS paper_title,
      p.status AS paper_status,
      pv.id AS paper_version_id,
      pv.version_number,
      pv.file_url,
      pv.created_at AS version_created_at
    FROM review_assignments ra
    LEFT JOIN reviews r
      ON ra.id = r.review_assignment_id
    LEFT JOIN papers p
      ON ra.paper_id = p.id
    LEFT JOIN paper_versions pv
      ON pv.paper_id = p.id
    WHERE ra.assigned_by = $1
    ORDER BY ra.id, pv.version_number DESC
    `,
    [subEditorId],
  );

  return result.rows;
};
