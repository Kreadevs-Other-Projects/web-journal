import { pool } from "../../configs/db";

export const getSubmittedReviewsBySubEditor = async (subEditorId: string) => {
  const result = await pool.query(
    `
    SELECT 
      ea.id AS "editorAssignmentId",
      ea.status AS "editorAssignmentStatus",
      ea.assigned_at AS "editorAssignedAt",

      p.id AS "paperId",
      p.title AS "title",
      p.status AS "paperStatus",

      pv.id AS "paperVersionId",
      pv.version_number AS "versionNumber",
      pv.file_url AS "fileUrl",
      pv.created_at AS "versionCreatedAt",

      ra.id AS "reviewAssignmentId",
      ra.reviewer_id AS "reviewerId",
      rv_user.username AS "reviewerName",
      ra.status AS "reviewAssignmentStatus",
      ra.submitted_at AS "submittedAt",

      r.id AS "reviewId",
      r.decision AS "decision",
      r.comments AS "comments",
      r.signature_url AS "signatureUrl",
      r.signed_at AS "signedAt"

    FROM editor_assignments ea

    JOIN papers p ON p.id = ea.paper_id

    LEFT JOIN paper_versions pv ON pv.id = p.current_version_id

    LEFT JOIN review_assignments ra
      ON ra.paper_id = ea.paper_id
      AND ra.assigned_by = ea.sub_editor_id
      AND ra.status = 'submitted'

    LEFT JOIN reviews r ON r.review_assignment_id = ra.id

    LEFT JOIN users rv_user ON rv_user.id = ra.reviewer_id

    WHERE ea.sub_editor_id = $1

    ORDER BY ra.submitted_at DESC NULLS LAST
    `,
    [subEditorId],
  );

  return result.rows;
};

export const updateEditorAssignmentStatus = async (
  editorAssignmentId: string,
  status: string,
) => {
  const result = await pool.query(
    `
    UPDATE editor_assignments
    SET status = $1
    WHERE id = $2
    RETURNING id, status
    `,
    [status, editorAssignmentId],
  );

  if (!result.rows.length) {
    throw new Error("Editor assignment not found");
  }

  return result.rows[0];
};
