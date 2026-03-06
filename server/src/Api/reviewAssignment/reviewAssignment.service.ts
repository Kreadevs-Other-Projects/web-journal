import * as reviewAssignmentRepo from "./reviewAssignment.repository";

export const getSubEditorAssignments = async (subEditorId: string) => {
  return await reviewAssignmentRepo.getReviewAssignmentsBySubEditor(
    subEditorId,
  );
};
