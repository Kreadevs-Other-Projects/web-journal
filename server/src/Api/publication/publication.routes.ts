import { Router } from "express";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  getSubmittedReviewsService,
  publishPaper,
} from "./publication.controller";
import { publishPaperSchema } from "./publication.schema";

const router = Router();

router.get(
  "/getSubmittedReviews",
  authMiddleware,
  authorize("journal_manager", "publisher"),
  getSubmittedReviewsService,
);

router.put(
  "/publishPaper/:paperId",
  authMiddleware,
  authorize("publisher"),
  validate(publishPaperSchema),
  publishPaper,
);

export default router;
