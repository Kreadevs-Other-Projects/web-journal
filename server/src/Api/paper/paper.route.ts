import { Router } from "express";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import {
  createPaper,
  getAllPapers,
  updatePaperStatus,
  getPapersByAuthor,
  getKeywordSuggestions,
} from "./paper.controller";
import { validate } from "../../middlewares/validate.middleware";
import { createPaperSchema, updatePaperSchema } from "./paper.schema";
import { manuscriptUpload } from "../../middlewares/upload.middleware";

const router = Router();

router.get("/keyword-suggestions", authMiddleware, getKeywordSuggestions);

router.post(
  "/createPaper",
  authMiddleware,
  authorize("author"),
  manuscriptUpload.single("manuscript"),
  createPaper,
);

router.get("/getAllPapers", authMiddleware, getAllPapers);

router.get(
  "/getPapersByAuthor",
  authMiddleware,
  authorize("author"),
  getPapersByAuthor,
);

router.put(
  "/updatePaperStatus/:paperId",
  authMiddleware,
  authorize("editor", "owner", "admin"),
  validate(updatePaperSchema),
  updatePaperStatus,
);

export default router;
