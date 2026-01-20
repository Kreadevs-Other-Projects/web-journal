import { Router } from "express";
import {
  getJournals,
  getPapers,
  assignSubEditor,
  assignReviewer,
  updatePaperStatus,
} from "../controllers/cheifEditor.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import {
  assignSubEditorSchema,
  assignReviewerSchema,
  paperStatusSchema,
} from "../schemas/cheifEditor.schema";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.get(
  "/getJournals",
  authMiddleware,
  authorize("chief_editor"),
  getJournals,
);
router.get(
  "/getPapers/:journalId",
  authMiddleware,
  authorize("chief_editor"),
  getPapers,
);

router.post(
  "/assignSubEditor/:paperId",
  authMiddleware,
  authorize("chief_editor"),
  validate(assignSubEditorSchema),
  assignSubEditor,
);

router.post(
  "/assignReviewer/:paperId",
  authMiddleware,
  authorize("chief_editor"),
  validate(assignReviewerSchema),
  assignReviewer,
);

router.patch(
  "/updatePaperStatus/:paperId",
  authMiddleware,
  authorize("chief_editor"),
  validate(paperStatusSchema),
  updatePaperStatus,
);

export default router;
