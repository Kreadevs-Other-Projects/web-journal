import { Response } from "express";
import {
  uploadPaperVersionService,
  getPaperVersionsService,
} from "./paperVersion.service";
import { uploadBufferToSupabase } from "../../utils/uploadToSupabase";

export const uploadPaperVersion = async (req: any, res: Response) => {
  try {
    if (!req.file || !req.body.version_label) {
      return res.status(400).json({
        success: false,
        message: "Both file and version_label are required.",
      });
    }

    const uploaded = await uploadBufferToSupabase(req.file.buffer, "manuscripts", req.file.originalname);
    const version = await uploadPaperVersionService(
      req.user,
      req.params.paperId,
      {
        version_label: req.body.version_label,
        file_url: uploaded.url,
        file_size: req.file.size,
        file_type: req.file.mimetype,
      },
    );

    return res.status(201).json({
      success: true,
      message: `Version "${version.version_label}" uploaded successfully.`,
      version,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to upload paper version.",
    });
  }
};

export const getPaperVersions = async (req: any, res: Response) => {
  const versions = await getPaperVersionsService(req.params.paperId);
  res.json({ success: true, versions });
};
