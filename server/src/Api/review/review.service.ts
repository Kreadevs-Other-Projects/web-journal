import {
  submitReview,
  updateReviewAssignmentStatus,
} from "./review.repository";
import {} from "../reviewAssignment/reviewAssignment.repository";

export const submitReviewService = async (
  user: { role: string },
  review_assignment_id: string,
  data: any,
) => {
  if (user.role !== "reviewer") {
    throw new Error("Only reviewers can submit reviews");
  }

  const review = await submitReview(review_assignment_id, data);

  await updateReviewAssignmentStatus(review_assignment_id);

  return review;
};
