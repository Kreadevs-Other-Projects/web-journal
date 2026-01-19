import { Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import {
  uploadPaperVersionService,
  getPaperVersionsService,
  getAllPaperVersionsService,
} from "../services/paperVersion.service";

export const uploadPaperVersion = async (req: AuthUser, res: Response) => {
  try {
    const { version_label } = req.body;

    if (!version_label || !req.file) {
      return res.status(400).json({
        success: false,
        message: "version_label and file are required",
      });
    }

    const file_url = `/uploads/${req.file.filename}`;

    const version = await uploadPaperVersionService(
      req.user!,
      req.params.paperId,
      {
        version_label,
        file_url,
        uploaded_by: req.user!.id,
      },
    );

    res.status(201).json({ success: true, version });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getPaperVersions = async (req: AuthUser, res: Response) => {
  const versions = await getPaperVersionsService(req.params.paperId);
  res.json({ success: true, versions });
};

export const getAllPaperVersions = async (req: AuthUser, res: Response) => {
  try {
    const versions = await getAllPaperVersionsService();
    res.json({ success: true, versions });
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch paper versions" });
  }
};
