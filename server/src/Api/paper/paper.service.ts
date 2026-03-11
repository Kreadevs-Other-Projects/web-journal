import {
  createPaper,
  getAllPapers,
  updatePaperStatus,
  getPapersByAuthor,
  insertStatusLog,
  getKeywordSuggestions,
} from "./paper.repository";
import { sendSubmissionConfirmationEmail } from "../../utils/emails/paperEmails";

export const createPaperService = async (
  data: any,
  authorEmail?: string,
  authorUsername?: string,
) => {
  const paper = await createPaper(data);

  await insertStatusLog({
    paper_id: paper.id,
    status: "submitted",
    changed_by: data.author_id,
    note: "Paper submitted",
  });

  if (authorEmail && authorUsername) {
    sendSubmissionConfirmationEmail(authorEmail, authorUsername, paper.title, paper.id).catch(
      () => {},
    );
  }

  return paper;
};

export const getKeywordSuggestionsService = async (q: string) => {
  return getKeywordSuggestions(q);
};

export const getAllPapersService = async () => getAllPapers();

export const getPapersByAuthorService = async (author_id: string) =>
  getPapersByAuthor(author_id);

export const updatePaperStatusService = async (
  user: any,
  paper_id: string,
  status: string,
) => {
  if (!["editor", "owner", "admin"].includes(user.role)) {
    throw new Error("Unauthorized");
  }

  return updatePaperStatus(paper_id, status);
};
