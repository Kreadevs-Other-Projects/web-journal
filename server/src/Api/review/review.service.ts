import {
  submitReview,
  updateReviewAssignmentStatus,
} from "./review.repository";
import {} from "../reviewAssignment/reviewAssignment.repository";
import { pool } from "../../configs/db";
import bcrypt from "bcrypt";

export const submitReviewService = async (
  user: { id: string; role: string; email?: string },
  review_assignment_id: string,
  data: any,
) => {
  if (user.role !== "reviewer") {
    throw new Error("Only reviewers can submit reviews");
  }

  const { email, password, ...reviewData } = data;

  if (!email || !password) {
    throw new Error("Email and password are required to submit a review");
  }

  // Credential verification
  const userRes = await pool.query(
    `SELECT * FROM users WHERE id = $1 AND email = $2`,
    [user.id, email],
  );
  if (!userRes.rows.length) {
    throw new Error("Email does not match your account");
  }
  const passwordValid = await bcrypt.compare(password, userRes.rows[0].password);
  if (!passwordValid) {
    throw new Error("Incorrect password");
  }

  const review = await submitReview(review_assignment_id, reviewData);

  await updateReviewAssignmentStatus(review_assignment_id);

  return review;
};
