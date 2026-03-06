import { Router } from "express";
import { getReviewerPapers, submitReview } from "./reviewer.controller";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import { zSubmitReviewSchema } from "./reviewer.schema";
import { validate } from "../../middlewares/validate.middleware";
import { upload } from "../../middlewares/upload.middleware";

const router = Router();

router.get(
  "/getReviewerPapers",
  authMiddleware,
  authorize("reviewer"),
  getReviewerPapers,
);

router.post(
  "/submitReview/:paperId",
  authMiddleware,
  authorize("reviewer"),
  upload.single("signature"),
  validate(zSubmitReviewSchema),
  submitReview,
);

export default router;
