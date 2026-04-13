import { Router } from "express";
import { applyAsReviewer, sendContactMessage } from "./contact.controller";
import multer from "multer";
import path from "path";
import fs from "fs";

const profilesDir = path.join(process.cwd(), "uploads", "profiles");
if (!fs.existsSync(profilesDir)) fs.mkdirSync(profilesDir, { recursive: true });

const profilePicUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, profilesDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `profile-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG or WebP images are accepted"));
  },
});

const router = Router();

router.post("/", sendContactMessage);
router.post("/apply-reviewer", profilePicUpload.single("profile_pic"), applyAsReviewer);

export default router;
