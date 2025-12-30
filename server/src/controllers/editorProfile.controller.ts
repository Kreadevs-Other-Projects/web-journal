import { Request, Response } from "express";
import {
  approveEditorProfile,
  updateExpertiseService,
} from "../services/editorProfile.service";

export const approveEditor = async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;
    const adminId = (req as any).user.id;

    const result = await approveEditorProfile(profileId, adminId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateExpertise = async (req: Request, res: Response) => {
  try {
    const { profileId } = req.params;
    const { expertise } = req.body;

    if (!Array.isArray(expertise)) {
      return res
        .status(400)
        .json({ success: false, message: "Expertise must be an array" });
    }

    const updatedProfile = await updateExpertiseService(profileId, expertise);
    res.json({ success: true, updatedProfile });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};
