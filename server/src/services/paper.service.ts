import {
  createPaper,
  getAllPapers,
  updatePaperStatus,
} from "../repositories/paper.repository";

export const createPaperService = async (
  user: { id: string; role: string },
  data: any,
) => {
  if (user.role !== "author") {
    throw new Error("Only publishers can upload papers");
  }

  return await createPaper(user.id, data);
};

export const getAllPapersService = async () => {
  return await getAllPapers();
};

export const updatePaperStatusService = async (
  user: { role: string },
  paper_id: string,
  status: string,
) => {
  if (!["editor", "owner"].includes(user.role)) {
    throw new Error("Unauthorized");
  }

  return await updatePaperStatus(paper_id, status);
};
