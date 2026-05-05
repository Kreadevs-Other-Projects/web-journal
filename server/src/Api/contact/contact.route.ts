import { Router } from "express";
import { applyAsReviewer, sendContactMessage } from "./contact.controller";
import multer from "multer";

const profilePicUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG or WebP images are accepted"));
  },
});

const router = Router();

router.post("/msg", sendContactMessage);
router.post("/apply-reviewer", profilePicUpload.single("profile_pic"), applyAsReviewer);

export default router;
