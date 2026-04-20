import { Request, Response } from "express";
import * as service from "./reviewer.service";
import { AuthUser } from "../../middlewares/auth.middleware";

export const getReviewerPapers = async (req: AuthUser, res: Response) => {
  const papers = await service.fetchReviewerPapers(req.user!.id);
  res.json({ success: true, papers });
};

export const submitReview = async (req: AuthUser, res: Response) => {
  try {
    const { paperId } = req.params;
    const { decision, comments, confidentialComments, password } = req.body;
    const signatureFile = req.file;

    const review = await service.submitPaperReview(
      paperId,
      req.user!.id,
      decision,
      comments,
      confidentialComments, // Pass it here
      password,
      signatureFile?.filename,
    );

    res.json({ success: true, data: review });
  } catch (error) {
    console.error("Error in submitReview:", error);
    res.status(500).json({ success: false, error });
  }
};
export async function submitReview(req: AuthUser, res: Response) {
  try {
    const { paperId } = req.params;
    // Add confidentialComments here
    const { decision, comments, confidentialComments, password } = req.body;

    const signatureFile = req.file;

    const review = await service.submitPaperReview(
      paperId,
      req.user!.id,
      decision,
      comments,
      confidentialComments, // Pass it here
      password,
      signatureFile?.filename,
    );

    res.json({ success: true, data: review });
  } catch (error) {
    console.error("Error in submitReview:", error);
    res.status(500).json({ success: false, error });
  }
}
