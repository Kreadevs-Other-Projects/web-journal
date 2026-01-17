import { Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import { assignEditorService } from "../services/editorAssignment.service";

export const assignEditor = async (req: AuthUser, res: Response) => {
  try {
    const result = await assignEditorService(
      req.user!,
      req.params.paperId,
      req.body.sub_editor_id,
    );

    res.status(201).json({ success: true, assignment: result });
  } catch (e: any) {
    res.status(403).json({ success: false, message: e.message });
  }
};
