import { Router } from "express";
import {
  getSubEditorPapers,
  updateSubEditorPaperStatus,
  getReviewersForPaper,
} from "../controllers/subEditor.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { zSubEditorStatusSchema } from "../schemas/subEditor.schema";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.get(
  "/getSubEditorPapers",
  authorize("sub_editor"),
  validate(zSubEditorStatusSchema),
  getSubEditorPapers,
);
router.patch(
  "/updateSubEditorPaperStatus/:paperId",
  authMiddleware,
  authorize("sub_editor"),
  validate(zSubEditorStatusSchema),
  updateSubEditorPaperStatus,
);
router.get(
  "/getReviewersForPaper/:paperId",
  authorize("sub_editor"),
  validate(zSubEditorStatusSchema),
  getReviewersForPaper,
);

export default router;
