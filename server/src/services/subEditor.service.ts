import * as repo from "../repositories/subEditor.repository";

export const fetchSubEditorPapers = async (subEditorId: string) => {
  return repo.getSubEditorPapers(subEditorId);
};

export const getReviewer = async () => {
  return repo.findReviewer();
};

export const assignReviewer = async (
  paperId: string,
  reviewerId: string,
  assignedBy: string,
) => {
  const assignment = await repo.assignReviewer(paperId, reviewerId, assignedBy);
  return assignment;
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
