import { Router } from "express";
import {
  getSubEditorPapers,
  updateSubEditorPaperStatus,
  getReviewersForPaper,
  fetchReviewer,
  assignReviewer,
  reviewerInvite,
  suggestReviewer,
  getPendingReviewerRequests,
  reviewReviewerRequest,
  getReviewsForPaper,
  subEditorDecision,
  getExistingDecision,
} from "./subEditor.controller";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import { requireProfileCompleted } from "../../middlewares/profileCompleted.middleware";
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
  requireProfileCompleted,
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

router.get(
  "/getReviewsForPaper/:paperId",
  authMiddleware,
  authorize("sub_editor", "chief_editor"),
  getReviewsForPaper,
);

router.post(
  "/decision/:paperId",
  authMiddleware,
  authorize("sub_editor"),
  requireProfileCompleted,
  subEditorDecision,
);

router.get(
  "/existingDecision/:paperId",
  authMiddleware,
  authorize("sub_editor"),
  getExistingDecision,
);

// Reviewer requests (sub_editor → chief_editor approval)
router.post(
  "/suggestReviewer/:paperId",
  authMiddleware,
  authorize("sub_editor"),
  suggestReviewer,
);

router.get(
  "/pending-reviewer-requests",
  authMiddleware,
  authorize("chief_editor"),
  getPendingReviewerRequests,
);

router.put(
  "/reviewer-requests/:requestId/review",
  authMiddleware,
  authorize("chief_editor"),
  reviewReviewerRequest,
);

export default router;
