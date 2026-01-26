import * as repo from "../repositories/subEditor.repository";

export const fetchSubEditorPapers = async (subEditorId: string) => {
  return repo.getSubEditorPapers(subEditorId);
};

export const addReviewer = async (
  paperId: string,
  reviewerId: string,
  assignedBy: string,
) => {
  return repo.assignReviewer(paperId, reviewerId, assignedBy);
};

export const setSubEditorPaperStatus = async (
  paperId: string,
  status: string,
) => {
  return repo.updatePaperStatusSubEditor(paperId, status);
};

export const fetchAssignedReviewers = async (paperId: string) => {
  return repo.getAssignedReviewers(paperId);
};
