import * as repo from "../repositories/cheifEditor.repository";

export const fetchEditorJournals = async (editorId: string) => {
  return repo.getEditorJournals(editorId);
};

export const fetchJournalPapers = async (journalId: string) => {
  return repo.getJournalPapers(journalId);
};

export const addSubEditor = async (
  paperId: string,
  subEditorId: string,
  assignedBy: string,
) => {
  return repo.assignSubEditor(paperId, subEditorId, assignedBy);
};

export const addReviewer = async (
  paperId: string,
  reviewerId: string,
  assignedBy: string,
) => {
  return repo.assignReviewer(paperId, reviewerId, assignedBy);
};

export const changePaperStatus = async (paperId: string, status: string) => {
  return repo.updatePaperStatus(paperId, status);
};
