import { Request, Response } from "express";
import * as service from "../services/cheifEditor.service";
import { AuthUser } from "../middlewares/auth.middleware";

export const getJournals = async (req: AuthUser, res: Response) => {
  const editorId = req.user!.id;
  const journals = await service.fetchEditorJournals(editorId);
  res.json({ success: true, data: journals });
};

export const getPapers = async (req: Request, res: Response) => {
  const { journalId } = req.params;
  const papers = await service.fetchJournalPapers(journalId);
  res.json({ success: true, data: papers });
};

export const assignSubEditor = async (req: AuthUser, res: Response) => {
  const { paperId } = req.params;
  const { subEditorId } = req.body;
  const assignedBy = req.user!.id;

  const assignment = await service.addSubEditor(
    paperId,
    subEditorId,
    assignedBy,
  );
  res.json({ success: true, data: assignment });
};

export const assignReviewer = async (req: AuthUser, res: Response) => {
  const { paperId } = req.params;
  const { reviewerId } = req.body;
  const assignedBy = req.user!.id;

  const assignment = await service.addReviewer(paperId, reviewerId, assignedBy);
  res.json({ success: true, data: assignment });
};

export const updatePaperStatus = async (req: Request, res: Response) => {
  const { paperId } = req.params;
  const { status } = req.body;

  const updatedPaper = await service.changePaperStatus(paperId, status);
  res.json({ success: true, data: updatedPaper });
};
