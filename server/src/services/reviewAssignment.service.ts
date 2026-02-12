import * as reviewAssignmentRepo from "../repositories/reviewAssignment.repository";

export const getSubEditorAssignments = async (subEditorId: string) => {
  return await reviewAssignmentRepo.getReviewAssignmentsBySubEditor(
    subEditorId,
  );
};
