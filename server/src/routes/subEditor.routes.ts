import { Router } from "express";
import {
  getSubEditorPapers,
  updateSubEditorPaperStatus,
  getReviewersForPaper,
  assignReviewer,
} from "../controllers/subEditor.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import {
  zSubEditorStatusSchema,
  assignReviewerSchema,
} from "../schemas/subEditor.schema";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.get(
  "/getSubEditorPapers",
  authMiddleware,
  authorize("sub_editor"),
  getSubEditorPapers,
);

router.post(
  "/assignReviewer/:paperId",
  authMiddleware,
  authorize("sub_editor"),
  validate(assignReviewerSchema),
  assignReviewer,
);

router.put(
  "/updateSubEditorPaperStatus/:paperId",
  authMiddleware,
  authorize("sub_editor"),
  validate(zSubEditorStatusSchema),
  updateSubEditorPaperStatus,
);

router.get(
  "/getReviewersForPaper/:paperId",
  authMiddleware,
  authorize("sub_editor"),
  getReviewersForPaper,
);

export default router;
