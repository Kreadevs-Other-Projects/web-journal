import * as repo from "./chiefEditor.repository";
import { sendSubEditorInviteEmail } from "../../utils/emails/userEmails";

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

export const getReviewers = async () => {
  return repo.findReviewers();
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

  const currentPaper = await repo.getPaperByIdRepo(paperId);
  if (currentPaper?.status === "published") {
    throw new Error("Cannot change the status of a published paper.");
  }

  const decisionRow = await repo.createEditorDecision(
    paperId,
    editorId,
    decision,
    note || "",
  );

  // Map decision values to valid paper_status enum values
  const statusMap: Record<string, string> = {
    revision: "pending_revision",
    accepted: "accepted",
    rejected: "rejected",
  };
  const paperStatus = statusMap[decision] ?? decision;
  const updatedPaper = await repo.updatePaperStatus(paperId, paperStatus);

  return {
    decision: decisionRow,
    paper: updatedPaper,
  };
};

export const changePaperStatus = async (paperId: string, status: string) => {
  const currentPaper = await repo.getPaperByIdRepo(paperId);
  if (currentPaper?.status === "published") {
    throw new Error("Cannot change the status of a published paper.");
  }
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

export const getPapersByIssueService = async (issueId: string) => {
  if (!issueId) throw new Error("Issue ID is required");

  const papers = await repo.getPapersByIssueRepo(issueId);

  return papers.map((paper: any) => ({
    id: paper.id,
    title: paper.title,
    status: paper.status,
    authors: paper.author_name ? [paper.author_name] : [],
    submittedDate: paper.submitted_date,
    issueId: paper.issue_id,
    journalId: paper.journal_id,
  }));
};

export const assignPaperToIssueService = async (
  paperId: string,
  issueId: string,
) => {
  if (!paperId || !issueId) {
    throw new Error("Paper ID and Issue ID are required");
  }

  const issue = await repo.getIssueByIdRepo(issueId);
  if (!issue) {
    throw new Error("Issue not found");
  }
  if (issue.status === "closed" || issue.status === "published") {
    throw new Error(`Cannot assign paper. Issue is ${issue.status}.`);
  }

  const paper = await repo.getPaperByIdRepo(paperId);
  if (!paper) {
    throw new Error("Paper not found");
  }

  if (paper.issue_id) {
    throw new Error("Paper is already assigned to an issue");
  }

  if (paper.journal_id !== issue.journal_id) {
    throw new Error("Paper does not belong to the same journal as this issue");
  }

  return await repo.assignPaperToIssueRepo(paperId, issueId);
};

export const getJournalDetailsService = async (journalId: string, chiefEditorId: string) => {
  const data = await repo.getJournalDetailsRepo(journalId, chiefEditorId);
  if (!data) throw new Error("Journal not found or access denied");
  return data;
};

export const updateIssueStatusService = async (
  issueId: string,
  status: "open" | "closed",
) => {
  if (!["open", "closed"].includes(status)) {
    throw new Error("Invalid status. Must be 'open' or 'closed'");
  }

  const issue = await repo.getIssueByIdRepo(issueId);
  if (!issue) {
    throw new Error("Issue not found");
  }

  try {
    return await repo.updateIssueStatusRepo(issueId, status);
  } catch (err: any) {
    // Unique constraint: one_open_issue_per_journal
    if (err.code === "23505" || err.message?.includes("one_open_issue_per_journal")) {
      throw new Error("Another issue is already open. Close it first before opening a new one.");
    }
    throw err;
  }
};
