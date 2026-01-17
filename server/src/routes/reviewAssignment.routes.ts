import { Router } from "express";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { assignReviewer } from "../controllers/reviewAssignment.controller";
import { assignReviewerSchema } from "../schemas/reviewAssignment.schema";

const router = Router();

router.post(
  "/assignReviewer/:paperId/reviewer",
  authMiddleware,
  authorize("editor"),
  validate(assignReviewerSchema),
  assignReviewer,
);

export default router;
