import { Request, Response } from "express";
import { updateReviewerProfileService } from "../services/reviewer.service";

export const updateReviewerProfileController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;
    const { certification, qualifications } = req.body;

    if (!certification) {
      return res.status(400).json({
        success: false,
        message: "Certification is required",
      });
    }

    if (!Array.isArray(qualifications)) {
      return res.status(400).json({
        success: false,
        message: "Qualifications must be an array",
      });
    }

    const profile = await updateReviewerProfileService(
      userId,
      certification,
      qualifications
    );

    res.json({ success: true, profile });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};
