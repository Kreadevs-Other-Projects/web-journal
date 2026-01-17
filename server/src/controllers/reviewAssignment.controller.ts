import { Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import { assignReviewerService } from "../services/reviewAssignment.service";

export const assignReviewer = async (req: AuthUser, res: Response) => {
  try {
    const result = await assignReviewerService(
      req.user!,
      req.params.paperId,
      req.body.reviewer_id,
    );

    res.status(201).json({ success: true, assignment: result });
  } catch (e: any) {
    res.status(403).json({ success: false, message: e.message });
  }
};
