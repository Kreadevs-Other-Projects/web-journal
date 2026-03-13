import { Response } from "express";
import { AuthUser } from "../../middlewares/auth.middleware";
import { getSubmittedReviews, setPaperPublished } from "./publication.service";

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
    const { issueId, doi } = req.body;
    const user = req.user!;

    if (user.role !== "journal_manager") {
      return res.status(403).json({
        success: false,
        message: "Only Journal Manager can publish paper",
      });
    }

    if (!issueId) {
      return res.status(400).json({
        success: false,
        message: "Issue ID is required",
      });
    }

    if (!doi || !doi.trim()) {
      return res.status(400).json({
        success: false,
        message: "DOI is required before publication",
      });
    }

    const published = await setPaperPublished(paperId, user.id, issueId, doi);

    return res.json({
      success: true,
      data: published,
    });
  } catch (error: any) {
    const status = error.message?.includes("DOI") ? 400 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to publish paper",
    });
  }
};
