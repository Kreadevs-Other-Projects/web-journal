import { Request, Response } from "express";
import * as service from "../services/chiefEditor.service";
import { AuthUser } from "../middlewares/auth.middleware";

export const getChiefEditorJournals = async (req: AuthUser, res: Response) => {
  try {
    const chiefEditorId = req.user!.id;

    const journals = await service.getChiefEditorJournalsService(chiefEditorId);

    return res.status(200).json({
      success: true,
      journal: journals,
    });
  } catch (error: any) {
    console.error("[getChiefEditorJournals]", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch journals",
    });
  }
};

export const getPapersByJournalId = async (req: Request, res: Response) => {
  const { journalId } = req.params;

  const papers = await service.getPapersByJournalIdService(journalId);

  return res.status(200).json({
    success: true,
    papers: papers,
  });
};

export const fetchChiefEditors = async (req: Request, res: Response) => {
  const users = await service.getChiefEditors();

  res.json({
    success: true,
    data: users,
  });
};

export const getAllPapers = async (req: AuthUser, res: Response) => {
  const papers = await service.fetchAllPapers(req.user!.id);
  res.json({ success: true, data: papers });
};

export const fetchSubEditors = async (req: Request, res: Response) => {
  const users = await service.getSubEditors();

  res.json({
    success: true,
    data: users,
  });
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

export const decidePaper = async (req: AuthUser, res: Response) => {
  const { paperId } = req.params;
  const { decision, decision_note } = req.body;

  const result = await service.makeEditorDecision(
    paperId,
    req.user!.id,
    decision,
    decision_note,
  );

  res.json({
    success: true,
    message: "Editor decision saved successfully",
    data: result,
  });
};

export const updatePaperStatus = async (req: Request, res: Response) => {
  const { paperId } = req.params;
  const { status } = req.body;

  const updatedPaper = await service.changePaperStatus(paperId, status);
  res.json({ success: true, data: updatedPaper });
};

export const getSubmittedReviews = async (req: AuthUser, res: Response) => {
  const chiefEditorId = req.user!.id;
  console.log(chiefEditorId);

  const reviews = await service.getSubmittedReviews(chiefEditorId);

  return res.status(200).json({ success: true, data: reviews });
};

export const SubEditorInvite = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const result = await service.sendInviteEmailSubEditor(email);

    res.json({ message: "Invitation email sent successfully", data: result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
