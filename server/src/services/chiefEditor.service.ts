import * as repo from "../repositories/chiefEditor.repository";
import { sendSubEditorInviteEmail } from "../utils/email";

export const getChiefEditorJournalsService = async (chiefEditorId: string) => {
  if (!chiefEditorId) {
    throw new Error("Chief Editor ID is required");
  }

  const journals = await repo.getChiefEditorJournals(chiefEditorId);
  return journals;
};

export const getPapersByJournalIdService = async (journalId: string) => {
  if (!journalId) {
    throw new Error("Journal ID is required");
  }

  const papers = await repo.getPapersByJournalId(journalId);

  return papers;
};

export const getChiefEditors = async () => {
  return repo.findChiefEditors();
};

export const fetchAllPapers = async (journalId: string) => {
  return repo.getAllPapers(journalId);
};

export const getSubEditors = async () => {
  return repo.findSubEditors();
};

export const addSubEditor = async (
  paperId: string,
  subEditorId: string,
  assignedBy: string,
) => {
  try {
    return repo.assignSubEditor(paperId, subEditorId, assignedBy);
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      throw new Error(error.message || "Failed to create journal!");
    }
  }
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

export const getSubmittedReviews = async (chiefEditorId: string) => {
  return repo.getSubmittedReviewsByChiefEditor(chiefEditorId);
};

export const sendInviteEmailSubEditor = async (email: string) => {
  const signupLink = `${process.env.CORS_ORIGIN}/signup`;

  await sendSubEditorInviteEmail(email, signupLink);

  return { email, signupLink };
};
