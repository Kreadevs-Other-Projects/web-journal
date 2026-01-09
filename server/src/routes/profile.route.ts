import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  getProfile,
  editProfile,
  removeProfile,
} from "../controllers/profile.controller";
import { updateProfileSchema } from "../schemas/profile.schema";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.get("/getProfile", authMiddleware, asyncHandler(getProfile));
router.put(
  "/updateProfile",
  authMiddleware,
  upload.single("profilePic"),
  validate(updateProfileSchema),
  asyncHandler(editProfile)
);
router.delete("/deleteProfile", authMiddleware, asyncHandler(removeProfile));

export default router;
