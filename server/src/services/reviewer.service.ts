import * as repo from "../repositories/reviewer.repository";

export const fetchReviewerPapers = async (reviewerId: string) => {
  return repo.getReviewerPapers(reviewerId);
};

export const submitPaperReview = async (
  paperId: string,
  reviewerId: string,
  decision: string,
  comments: string,
) => {
  return repo.submitReview(paperId, reviewerId, decision, comments);
};
