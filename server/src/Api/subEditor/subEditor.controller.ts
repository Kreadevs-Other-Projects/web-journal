import { Request, Response } from "express";
import * as service from "./subEditor.service";
import { AuthUser } from "../../middlewares/auth.middleware";

export const getSubEditorPapers = async (req: AuthUser, res: Response) => {
  const papers = await service.fetchSubEditorPapers(req.user!.id);
  res.json({ success: true, papers });
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

export const reviewerInvite = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const result = await service.sendInviteEmailReviewer(email);

    res.json({ message: "Invitation email sent successfully", data: result });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
