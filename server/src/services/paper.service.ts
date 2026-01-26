import {
  createPaper,
  getAllPapers,
  updatePaperStatus,
  getPapersByAuthor,
} from "../repositories/paper.repository";

export const createPaperService = async (data: any) => {
  return createPaper(data);
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
