import { Request, Response } from "express";
import * as service from "../services/reviewer.service";
import { AuthUser } from "../middlewares/auth.middleware";

export const getReviewerPapers = async (req: AuthUser, res: Response) => {
  const papers = await service.fetchReviewerPapers(req.user!.id);
  res.json({ success: true, data: papers });
};

export const submitReview = async (req: AuthUser, res: Response) => {
  try {
    const { paperId } = req.params;
    const { decision, comments } = req.body;

    const review = await service.submitPaperReview(
      paperId,
      req.user!.id,
      decision,
      comments,
    );

    res.json({ success: true, data: review });
  } catch (error) {
    console.error("Error in submitReview:", error);
    res.status(500).json({ success: false, error });
  }
};
