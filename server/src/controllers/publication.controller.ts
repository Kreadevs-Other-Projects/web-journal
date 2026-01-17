import { Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import { publishPaperService } from "../services/publication.service";

export const publishPaper = async (req: AuthUser, res: Response) => {
  try {
    const publication = await publishPaperService(
      req.user!,
      req.params.paperId,
      req.body.issue_id,
      req.body.year_label,
    );

    return res.status(201).json({
      success: true,
      message: "Paper published successfully",
      publication,
    });
  } catch (e: any) {
    return res.status(403).json({
      success: false,
      message: e.message,
    });
  }
};
