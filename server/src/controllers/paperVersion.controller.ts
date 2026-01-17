import { Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import {
  uploadPaperVersionService,
  getPaperVersionsService,
} from "../services/paperVersion.service";

export const uploadPaperVersion = async (req: AuthUser, res: Response) => {
  try {
    const version = await uploadPaperVersionService(
      req.user!,
      req.params.paperId,
      req.body,
    );

    res.status(201).json({ success: true, version });
  } catch (e: any) {
    res.status(403).json({ success: false, message: e.message });
  }
};

export const getPaperVersions = async (req: AuthUser, res: Response) => {
  const versions = await getPaperVersionsService(req.params.paperId);
  res.json({ success: true, versions });
};
