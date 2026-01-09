import { createPaper, getPaperById } from "../repositories/paper.repository";

export const createPaperService = async (
  data: {
    title: string;
    abstract?: string;
    category?: string;
    keywords?: string[];
    journal_id?: string;
  },
  authorId: string
) => {
  return createPaper(data, authorId);
};

export const getPaperByIdService = async (paperId: string) => {
  const paper = await getPaperById(paperId);
  if (!paper) throw new Error("Paper not found");
  return paper;
};
