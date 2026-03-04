import { Router } from "express";
import {
  getSubEditorPapers,
  updateSubEditorPaperStatus,
  getReviewersForPaper,
  fetchReviewer,
  assignReviewer,
  reviewerInvite,
} from "./subEditor.controller";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import {
  zSubEditorStatusSchema,
  assignReviewerSchema,
} from "./subEditor.schema";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();

router.get(
  "/getSubEditorPapers",
  authMiddleware,
  authorize("sub_editor"),
  getSubEditorPapers,
);

router.get(
  "/fetchReviewer",
  authMiddleware,
  authorize("sub_editor"),
  fetchReviewer,
);

router.post(
  "/assignReviewer/:paperId",
  authMiddleware,
  authorize("chief_editor", "sub_editor"),
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
  authorize("sub_editor", "chief_editor"),
  getReviewersForPaper,
);

router.post(
  "/inviteReviewer",
  authMiddleware,
  authorize("sub_editor"),
  reviewerInvite,
);

export default router;
