import { Request, Response } from "express";
import * as service from "./subEditor.service";
import { AuthUser } from "../../middlewares/auth.middleware";
import { pool } from "../../configs/db";

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

    // Sub editor must be assigned before reviewer
    const subEditorCheck = await pool.query(
      `SELECT id FROM editor_assignments WHERE paper_id = $1 AND status IN ('accepted', 'pending')`,
      [paperId],
    );
    if (subEditorCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "A Sub Editor must be assigned before assigning a reviewer",
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

export const getReviewsForPaper = async (req: Request, res: Response) => {
  try {
    const { paperId } = req.params;
    const reviews = await service.getReviewsForPaperService(paperId);
    res.json({ success: true, reviews });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const subEditorDecision = async (req: AuthUser, res: Response) => {
  try {
    const { paperId } = req.params;
    const { action, comments, email, password } = req.body;
    if (!["approve", "revision", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action. Must be approve, revision, or reject" });
    }
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required to submit a decision" });
    }
    const paper = await service.subEditorDecisionService(
      req.user!.id, email, password, paperId, action, comments,
    );
    res.json({ success: true, paper });
  } catch (e: any) {
    res.status(e.message.includes("Email does not match") || e.message.includes("Incorrect password") ? 401 : 400)
      .json({ success: false, message: e.message });
  }
};

export const suggestReviewer = async (req: AuthUser, res: Response) => {
  try {
    const { paperId } = req.params;
    const result = await service.suggestReviewerService(req.user!.id, paperId, req.body);
    res.status(201).json({ success: true, request: result });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const getPendingReviewerRequests = async (req: AuthUser, res: Response) => {
  try {
    const requests = await service.getPendingReviewerRequestsService(req.user!.id);
    res.json({ success: true, requests });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const reviewReviewerRequest = async (req: AuthUser, res: Response) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;
    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }
    const result = await service.reviewReviewerRequestService(req.user!, requestId, action);
    res.json({ success: true, request: result });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};
