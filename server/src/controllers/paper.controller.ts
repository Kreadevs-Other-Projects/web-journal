import { Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import {
  createPaperService,
  getAllPapersService,
  updatePaperStatusService,
  getPapersByAuthorService,
} from "../services/paper.service";

export const createPaper = async (req: AuthUser, res: Response) => {
  try {
    const paper = await createPaperService(req.user!, req.body);
    res.status(201).json({ success: true, paper });
  } catch (e: any) {
    res.status(403).json({ success: false, message: e.message });
  }
};

export const getAllPapers = async (_req: AuthUser, res: Response) => {
  const papers = await getAllPapersService();
  res.json({ success: true, papers });
};

export const getPapersByAuthor = async (req: AuthUser, res: Response) => {
  try {
    const author_id = req.user!.id;

    const papers = await getPapersByAuthorService(author_id);

    res.json({
      success: true,
      papers,
    });
  } catch (error) {
    console.error("Error fetching papers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch papers",
    });
  }
};

export const updatePaperStatus = async (req: AuthUser, res: Response) => {
  try {
    const paper = await updatePaperStatusService(
      req.user!,
      req.params.paperId,
      req.body.status,
    );

    res.json({ success: true, paper });
  } catch (e: any) {
    res.status(403).json({ success: false, message: e.message });
  }
};
