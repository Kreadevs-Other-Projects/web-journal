import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import {
  uploadPaperVersion,
  getPaperVersions,
  getAllPaperVersions,
} from "../controllers/paperVersion.controller";
import { createPaperVersionSchema } from "../schemas/paperVersion.schema";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.post(
  "/uploadPaperVersion/:paperId",
  authMiddleware,
  authorize("author"),
  upload.single("file"),
  uploadPaperVersion,
);

router.get("/getPaperVersions", authMiddleware, getPaperVersions);

router.get(
  "/getAllPaperVersions",
  authMiddleware,
  authorize("owner", "admin", "editor"),
  getAllPaperVersions,
);

export default router;
