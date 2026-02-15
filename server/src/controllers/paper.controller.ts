import { Response } from "express";
import {
  createPaperService,
  getAllPapersService,
  updatePaperStatusService,
  getPapersByAuthorService,
} from "../services/paper.service";
import { AuthUser } from "../middlewares/auth.middleware";

export const createPaper = async (req: AuthUser, res: Response) => {
  const paper = await createPaperService({
    ...req.body,
    author_id: req.user!.id,
  });

  res.status(201).json({
    success: true,
    data: paper,
  });
};

export const getAllPapers = async (req: AuthUser, res: Response) => {
  const papers = await getAllPapersService();
  res.json({ success: true, papers });
};

export const getPapersByAuthor = async (req: any, res: Response) => {
  const papers = await getPapersByAuthorService(req.user.id);
  res.json({ success: true, papers });
};

export const updatePaperStatus = async (req: any, res: Response) => {
  try {
    const paper = await updatePaperStatusService(
      req.user,
      req.params.paperId,
      req.body.status,
    );
    res.json({ success: true, paper });
  } catch (e: any) {
    res.status(403).json({ success: false, message: e.message });
  }
};
