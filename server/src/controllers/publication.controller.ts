import { Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import { setPaperPublished } from "../services/publication.service";

export const publishPaper = async (req: AuthUser, res: Response) => {
  try {
    const { paperId } = req.params;
    const user = req.user!;

    if (user.role !== "chief_editor") {
      return res.status(403).json({
        success: false,
        message: "Only Chief Editor can publish paper",
      });
    }

    const published = await setPaperPublished(paperId, user.id);

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
