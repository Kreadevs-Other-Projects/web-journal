import {
  submitReview,
  updateReviewAssignmentStatus,
} from "./review.repository";
import {} from "../reviewAssignment/reviewAssignment.repository";
import { pool } from "../../configs/db";

export const submitReviewService = async (
  user: { role: string },
  review_assignment_id: string,
  data: any,
) => {
  if (user.role !== "reviewer") {
    throw new Error("Only reviewers can submit reviews");
  }

  // Check if CE has overridden the paper's status
  const assignmentRes = await pool.query(
    `SELECT ra.paper_id, p.ce_override FROM review_assignments ra
     JOIN papers p ON p.id = ra.paper_id
     WHERE ra.id = $1`,
    [review_assignment_id],
  );
  if (assignmentRes.rows[0]?.ce_override) {
    throw new Error("This paper's status has been overridden by the Chief Editor and cannot be changed.");
  }

  const review = await submitReview(review_assignment_id, data);

  await updateReviewAssignmentStatus(review_assignment_id);

  return review;
};
