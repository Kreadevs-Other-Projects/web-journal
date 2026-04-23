import { Request, Response } from "express";
import * as service from "./reviewer.service";
import { AuthUser } from "../../middlewares/auth.middleware";
import { uploadToSupabase } from "../../utils/uploadToSupabase";

export const getReviewerPapers = async (req: AuthUser, res: Response) => {
  const papers = await service.fetchReviewerPapers(req.user!.id);
  res.json({ success: true, papers });
};

export const submitReview = async (req: AuthUser, res: Response) => {
  try {
    const { paperId } = req.params;
    const { decision, comments, confidentialComments, password } = req.body;

    let signatureUrl: string | undefined;
    if (req.file) {
      const uploaded = await uploadToSupabase(req.file.path, "other", req.file.originalname);
      signatureUrl = uploaded.url;
    }

    const review = await service.submitPaperReview(
      paperId,
      req.user!.id,
      decision,
      comments,
      password,
      signatureUrl,
      confidentialComments,
    );

    res.json({ success: true, data: review });
  } catch (error) {
    console.error("Error in submitReview:", error);
    res.status(500).json({ success: false, error });
  }
};
