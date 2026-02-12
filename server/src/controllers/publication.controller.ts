import { Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import {
  getSubmittedReviews,
  setPaperPublished,
} from "../services/publication.service";

export const getSubmittedReviewsService = async (
  req: AuthUser,
  res: Response,
) => {
  const reviews = await getSubmittedReviews();

  return res.status(200).json({
    success: true,
    data: reviews,
  });
};

export const publishPaper = async (req: AuthUser, res: Response) => {
  try {
    const { paperId } = req.params;
    const { issueId } = req.body;
    const user = req.user!;

    if (user.role !== "publisher_manager") {
      return res.status(403).json({
        success: false,
        message: "Only Publisher Manager can publish paper",
      });
    }

    if (!issueId) {
      return res.status(400).json({
        success: false,
        message: "Issue ID is required",
      });
    }

    const published = await setPaperPublished(paperId, user.id, issueId);

    return res.json({
      success: true,
      data: published,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to publish paper",
    });
  }
};
