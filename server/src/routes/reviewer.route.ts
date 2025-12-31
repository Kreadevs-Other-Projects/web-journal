import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authMiddleware } from "../middlewares/auth.middleware";
import { updateReviewerProfileController } from "../controllers/reviewer.controller";
import { updateReviewerProfileSchema } from "../schemas/reviewer.schema";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.put(
  "/profile",
  authMiddleware,
  validate(updateReviewerProfileSchema),
  asyncHandler(updateReviewerProfileController)
);

export default router;
