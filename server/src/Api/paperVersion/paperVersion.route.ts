import { Router } from "express";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import { upload } from "../../middlewares/upload.middleware";
import {
  uploadPaperVersion,
  getPaperVersions,
} from "./paperVersion.controller";

const router = Router();

router.post(
  "/uploadPaperVersion/:paperId",
  authMiddleware,
  authorize("author"),
  upload.single("file"),
  uploadPaperVersion,
);

router.get("/getPaperVersions/:paperId", authMiddleware, getPaperVersions);

export default router;
