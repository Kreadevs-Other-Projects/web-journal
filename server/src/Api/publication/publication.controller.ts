import { Response } from "express";
import { AuthUser } from "../../middlewares/auth.middleware";
import {
  getSubmittedReviews,
  setPaperPublished,
  suggestDoiService,
} from "./publication.service";

export const getSubmittedReviewsService = async (
  req: AuthUser,
  res: Response,
) => {
  const ownerId = req.user!.id;
  const reviews = await getSubmittedReviews(ownerId);

  return res.status(200).json({
    success: true,
    data: reviews,
  });
};

export const publishPaper = async (req: AuthUser, res: Response) => {
  try {
    const { paperId } = req.params;
    const { issueId, doi, year_label } = req.body;
    const user = req.user!;

    const published = await setPaperPublished(
      paperId,
      user.id,
      issueId,
      doi.trim(),
    );

    return res.json({
      success: true,
      data: published,
    });
  } catch (error: any) {
    const status = error.statusCode || (error.message?.includes("DOI") ? 400 : 500);
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to publish paper",
      ...(error.validation_errors ? { validation_errors: error.validation_errors } : {}),
    });
  }
};

export const suggestDoi = async (req: AuthUser, res: Response) => {
  try {
    const { paperId } = req.params;
    const doi = await suggestDoiService(paperId);
    console.log("Generated DOI:", doi);
    return res.json({ success: true, doi });
  } catch (error: any) {
    return res
      .status(404)
      .json({
        success: false,
        message: error.message || "Could not generate DOI",
      });
  }
};
