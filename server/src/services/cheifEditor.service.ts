import * as repo from "../repositories/cheifEditor.repository";

export const getChiefEditors = async () => {
  return repo.findChiefEditors();
};

export const fetchJournalPapers = async (journalId: string) => {
  return repo.getJournalPapers(journalId);
};

export const getSubEditors = async () => {
  return repo.findSubEditors();
};

export const addSubEditor = async (
  paperId: string,
  subEditorId: string,
  assignedBy: string,
) => {
  return repo.assignSubEditor(paperId, subEditorId, assignedBy);
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

export const makeEditorDecision = async (
  paperId: string,
  editorId: string,
  decision: string,
  note: string,
) => {
  const hasReviews = await repo.hasSubmittedReviews(paperId);

  if (!hasReviews) {
    throw new Error("Cannot decide without submitted reviews");
  }

  const decisionRow = await repo.createEditorDecision(
    paperId,
    editorId,
    decision,
    note,
  );

  const updatedPaper = await repo.updatePaperStatus(paperId, decision);

  return {
    decision: decisionRow,
    paper: updatedPaper,
  };
};

export const changePaperStatus = async (paperId: string, status: string) => {
  return repo.updatePaperStatus(paperId, status);
};
