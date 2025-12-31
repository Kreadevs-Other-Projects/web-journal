import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import {
  approveEditor,
  updateExpertise,
} from "../controllers/editorProfile.controller";

const router = Router();

// Only admin and chief-editor can approve
router.post(
  "/approve/:profileId",
  authMiddleware,
  authorize("admin", "chief-editor", "author"),
  asyncHandler(approveEditor)
);

router.put(
  "/expertise/:profileId",
  authMiddleware,
  asyncHandler(updateExpertise)
);

export default router;
