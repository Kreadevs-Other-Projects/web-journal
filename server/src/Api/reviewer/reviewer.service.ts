import * as repo from "./reviewer.repository";

export const fetchReviewerPapers = async (reviewerId: string) => {
  return repo.getReviewerPapers(reviewerId);
};

export const submitPaperReview = async (
  paperId: string,
  reviewerId: string,
  decision: string,
  comments: string,
  password?: string,
  signatureFilename?: string,
) => {
  return repo.submitReviewByVersion(
    paperId,
    reviewerId,
    decision,
    comments,
    password,
    signatureFilename,
  );
};
