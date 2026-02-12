import { Response } from "express";
import {
  uploadPaperVersionService,
  getPaperVersionsService,
} from "../services/paperVersion.service";

export const uploadPaperVersion = async (req: any, res: Response) => {
  try {
    if (!req.file || !req.body.version_label) {
      return res.status(400).json({
        success: false,
        message: "file and version_label required",
      });
    }

    const version = await uploadPaperVersionService(
      req.user,
      req.params.paperId,
      {
        version_label: req.body.version_label,
        file_url: `/uploads/${req.file.filename}`,
        file_size: req.file.size,
        file_type: req.file.mimetype,
      },
    );

    res.status(201).json({ success: true, version });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
};

export const getPaperVersions = async (req: any, res: Response) => {
  const versions = await getPaperVersionsService(req.params.paperId);
  res.json({ success: true, versions });
};
