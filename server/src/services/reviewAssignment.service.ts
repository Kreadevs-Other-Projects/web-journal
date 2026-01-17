import { assignReviewer } from "../repositories/reviewAssignment.repository";

export const assignReviewerService = async (
  user: { id: string; role: string },
  paper_id: string,
  reviewer_id: string,
) => {
  if (user.role !== "editor") {
    throw new Error("Only editor can assign reviewers");
  }

  return await assignReviewer(paper_id, reviewer_id, user.id);
};
