import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  getProfile,
  updateProfile,
  deleteProfile,
} from "../controllers/profile.controller";
import { updateProfileSchema } from "../schemas/profile.schema";

const router = Router();

router.get("/getProfile", authMiddleware, asyncHandler(getProfile));
router.put(
  "/updateProfile",
  authMiddleware,
  validate(updateProfileSchema),
  asyncHandler(updateProfile)
);
router.delete("/deleteProfile", authMiddleware, asyncHandler(deleteProfile));

export default router;
