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
  uploadRevisionController,
  getPaperHtmlController,
  getStatusLogController,
} from "./paper.controller";
import { suggestDoi } from "../publication/publication.controller";
import { validate } from "../../middlewares/validate.middleware";
import { createPaperSchema, updatePaperSchema } from "./paper.schema";
import { manuscriptUpload } from "../../middlewares/upload.middleware";

const router = Router();

router.get("/keyword-suggestions", authMiddleware, getKeywordSuggestions);

router.post(
  "/extract-metadata",
  authMiddleware,
  manuscriptUpload.single("file"),
  extractMetadata,
);

router.post(
  "/createPaper",
  authMiddleware,
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
  getPapersByAuthor,
);

router.put(
  "/updatePaperStatus/:paperId",
  authMiddleware,
  authorize("chief_editor", "publisher"),
  validate(updatePaperSchema),
  updatePaperStatus,
);

router.get(
  "/:paperId/tracking",
  authMiddleware,
  getPaperTrackingController,
);

router.post(
  "/:paperId/revision",
  authMiddleware,
  manuscriptUpload.single("manuscript"),
  uploadRevisionController,
);

router.get(
  "/:paperId/html",
  authMiddleware,
  authorize("sub_editor", "reviewer", "chief_editor", "author", "publisher"),
  getPaperHtmlController,
);

router.get(
  "/:paperId/metadata-check",
  authMiddleware,
  authorize("publisher", "chief_editor", "journal_manager"),
  getMetadataCheck,
);

router.get(
  "/:paperId/suggest-doi",
  authMiddleware,
  authorize("publisher"),
  suggestDoi,
);

router.get(
  "/:paperId/status-log",
  authMiddleware,
  getStatusLogController,
);

export default router;
