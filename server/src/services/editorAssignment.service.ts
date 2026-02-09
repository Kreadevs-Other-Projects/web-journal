import {
  getSubmittedReviewsBySubEditor,
  updateEditorAssignmentStatus,
} from "../repositories/editorAssignment.repository";

export const getSubmittedReviews = async (subEditorId: string) => {
  return getSubmittedReviewsBySubEditor(subEditorId);
};

export const acceptOrRejectAssignment = async (
  editorAssignmentId: string,
  status: string,
) => {
  return updateEditorAssignmentStatus(editorAssignmentId, status);
};
