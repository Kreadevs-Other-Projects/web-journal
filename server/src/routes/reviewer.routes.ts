import { Router } from "express";
import {
  getReviewerPapers,
  submitReview,
} from "../controllers/reviewer.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { zSubmitReviewSchema } from "../schemas/reviewer.schema";
import { validate } from "../middlewares/validate.middleware";

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
  validate(zSubmitReviewSchema),
  submitReview,
);

export default router;
