import { Request, Response } from "express";
import * as service from "../services/reviewer.service";
import { AuthUser } from "../middlewares/auth.middleware";

export const getReviewerPapers = async (req: AuthUser, res: Response) => {
  const papers = await service.fetchReviewerPapers(req.user!.id);
  res.json({ success: true, data: papers });
};

export const submitReview = async (req: AuthUser, res: Response) => {
  console.log("=== submitReview called ===");
  console.log("Request params:", req.params);
  console.log("Request body:", req.body);
  console.log("Authenticated user:", req.user);

  try {
    const { paperId } = req.params;
    const { decision, comments } = req.body;

    console.log("Extracted paperId:", paperId);
    console.log("Extracted decision:", decision);
    console.log("Extracted comments:", comments);

    const review = await service.submitPaperReview(
      paperId,
      req.user!.id,
      decision,
      comments,
    );

    console.log("Review returned from service:", review);

    res.json({ success: true, data: review });
    console.log("Response sent successfully");
  } catch (error) {
    console.error("Error in submitReview:", error);
    res.status(500).json({ success: false, error });
  }

  console.log("=== submitReview finished ===");
};
