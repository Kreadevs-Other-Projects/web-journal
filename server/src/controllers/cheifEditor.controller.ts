import { Request, Response } from "express";
import * as service from "../services/cheifEditor.service";
import { AuthUser } from "../middlewares/auth.middleware";

export const fetchChiefEditors = async (req: Request, res: Response) => {
  const users = await service.getChiefEditors();

  res.json({
    success: true,
    data: users,
  });
};

export const getPapers = async (req: AuthUser, res: Response) => {
  const papers = await service.fetchJournalPapers(req.user!.id);
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

export const fetchReviewer = async (req: Request, res: Response) => {
  const users = await service.getReviewer();

  res.json({
    success: true,
    data: users,
  });
};

export const assignReviewer = async (req: AuthUser, res: Response) => {
  try {
    const { paperId } = req.params;
    const { reviewerId } = req.body;
    const assignedBy = req.user!.id;

    if (!reviewerId) {
      return res.status(400).json({
        success: false,
        message: "Reviewer ID is required",
      });
    }

    const assignment = await service.assignReviewer(
      paperId,
      reviewerId,
      assignedBy,
    );

    return res.status(200).json({
      success: true,
      message: "Reviewer assigned successfully",
      data: assignment,
    });
  } catch (err) {
    console.error("Assign Reviewer Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to assign reviewer",
    });
  }
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
