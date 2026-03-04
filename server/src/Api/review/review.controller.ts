import { Response } from "express";
import { AuthUser } from "../../middlewares/auth.middleware";
import { submitReviewService } from "./review.service";

export const submitReview = async (req: AuthUser, res: Response) => {
  try {
    const review = await submitReviewService(
      req.user!,
      req.params.reviewAssignmentId,
      req.body,
    );

    res.status(201).json({ success: true, review });
  } catch (e: any) {
    res.status(403).json({ success: false, message: e.message });
  }
};
