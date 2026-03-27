import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { validate } from "../../middlewares/validate.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  getProfile,
  editProfile,
  removeProfile,
  changePasswordController,
  uploadCertification,
  getCertifications,
  deleteCertification,
} from "./profile.controller";
import { updateProfileSchema, changePasswordSchema } from "./profile.schema";
import { upload, certificationUpload } from "../../middlewares/upload.middleware";

const router = Router();

router.get("/getProfile", authMiddleware, asyncHandler(getProfile));

router.put(
  "/change-password",
  authMiddleware,
  validate(changePasswordSchema),
  changePasswordController,
);

router.put(
  "/updateProfile",
  authMiddleware,
  upload.single("profilePic"),
  validate(updateProfileSchema),
  asyncHandler(editProfile),
);

router.delete("/deleteProfile", authMiddleware, asyncHandler(removeProfile));

router.post(
  "/certifications",
  authMiddleware,
  certificationUpload.single("certification"),
  asyncHandler(uploadCertification),
);

router.get("/certifications", authMiddleware, asyncHandler(getCertifications));

router.delete(
  "/certifications/:certId",
  authMiddleware,
  asyncHandler(deleteCertification),
);

export default router;
