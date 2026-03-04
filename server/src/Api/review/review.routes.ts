import { Router } from "express";
import { submitReview } from "./review.controller";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import { submitReviewSchema } from "./review.schema";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();

router.post(
  "/submitReview/:reviewAssignmentId",
  authMiddleware,
  authorize("reviewer"),
  validate(submitReviewSchema),
  submitReview,
);

export default router;
