import { Request, Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import {
  createPaperVersionService,
  getPaperVersionsService,
} from "../services/paperVersion.service";

export const createPaperVersion = async (req: AuthUser, res: Response) => {
  const userId = req.user!.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const version = await createPaperVersionService(req.body, userId);

  res.status(201).json({
    success: true,
    message: "Paper version uploaded successfully",
    data: version,
  });
};

export const getPaperVersions = async (req: Request, res: Response) => {
  const { paperId } = req.params;

  const versions = await getPaperVersionsService(paperId);

  res.status(200).json({
    success: true,
    data: versions,
  });
};
