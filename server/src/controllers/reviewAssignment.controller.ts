import { Request, Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import * as reviewAssignmentService from "../services/reviewAssignment.service";

export const getSubEditorAssignments = async (req: AuthUser, res: Response) => {
  const subEditorId = req.user!.id;

  const assignments =
    await reviewAssignmentService.getSubEditorAssignments(subEditorId);

  res.json({ success: true, assignments });
};
