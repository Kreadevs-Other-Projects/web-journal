import { Router } from "express";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { assignEditor } from "../controllers/editorAssignment.controller";
import { assignEditorSchema } from "../schemas/editorAssignment.schema";

const router = Router();

router.post(
  "/assignEditor/:paperId",
  authMiddleware,
  authorize("owner", "editor"),
  validate(assignEditorSchema),
  assignEditor,
);

export default router;
