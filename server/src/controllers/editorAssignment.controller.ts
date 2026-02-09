import { Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import {
  getSubmittedReviews,
  acceptOrRejectAssignment,
} from "../services/editorAssignment.service";

export const getReviews = async (req: AuthUser, res: Response) => {
  const subEditorId = req.user!.id;

  const reviews = await getSubmittedReviews(subEditorId);

  return res.status(200).json({ success: true, data: reviews });
};

export const handleAssignmentStatus = async (req: AuthUser, res: Response) => {
  const { editorAssignmentId } = req.params;
  const { status } = req.body;

  try {
    const updated = await acceptOrRejectAssignment(editorAssignmentId, status);
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
};
