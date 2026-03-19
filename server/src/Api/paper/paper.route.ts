import { Router } from "express";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import {
  createPaper,
  getAllPapers,
  updatePaperStatus,
  getPapersByAuthor,
  getKeywordSuggestions,
  assignPaperToIssue,
  getPaperVersionsList,
  extractMetadata,
  getPaperTrackingController,
  getMetadataCheck,
} from "./paper.controller";
import { validate } from "../../middlewares/validate.middleware";
import { createPaperSchema, updatePaperSchema } from "./paper.schema";
import { manuscriptUpload } from "../../middlewares/upload.middleware";

const router = Router();

router.get("/keyword-suggestions", authMiddleware, getKeywordSuggestions);

router.post(
  "/extract-metadata",
  authMiddleware,
  authorize("author"),
  manuscriptUpload.single("file"),
  extractMetadata,
);

router.post(
  "/createPaper",
  authMiddleware,
  authorize("author"),
  manuscriptUpload.single("manuscript"),
  createPaper,
);

router.patch(
  "/:paperId/assign-issue",
  authMiddleware,
  authorize("journal_manager", "chief_editor"),
  assignPaperToIssue,
);

router.get("/:paperId/versions", authMiddleware, getPaperVersionsList);

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

router.get(
  "/:paperId/tracking",
  authMiddleware,
  authorize("author"),
  getPaperTrackingController,
);

router.get(
  "/:paperId/metadata-check",
  authMiddleware,
  authorize("publisher", "chief_editor", "journal_manager"),
  getMetadataCheck,
);

export default router;
