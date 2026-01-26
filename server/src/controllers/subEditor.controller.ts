import { Request, Response } from "express";
import * as service from "../services/subEditor.service";
import { AuthUser } from "../middlewares/auth.middleware";

export const getSubEditorPapers = async (req: AuthUser, res: Response) => {
  const papers = await service.fetchSubEditorPapers(req.user!.id);
  res.json({ success: true, data: papers });
};

export const assignReviewer = async (req: AuthUser, res: Response) => {
  const { paperId } = req.params;
  const { reviewerId } = req.body;
  const assignedBy = req.user!.id;

  const assignment = await service.addReviewer(paperId, reviewerId, assignedBy);
  res.json({ success: true, data: assignment });
};

export const updateSubEditorPaperStatus = async (
  req: Request,
  res: Response,
) => {
  const { paperId } = req.params;
  const { status } = req.body;
  const updated = await service.setSubEditorPaperStatus(paperId, status);
  res.json({ success: true, data: updated });
};

export const getReviewersForPaper = async (req: Request, res: Response) => {
  const { paperId } = req.params;
  const reviewers = await service.fetchAssignedReviewers(paperId);
  res.json({ success: true, data: reviewers });
};
