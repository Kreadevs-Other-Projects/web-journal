import { Router } from "express";
import {
  getPapers,
  assignSubEditor,
  updatePaperStatus,
  decidePaper,
  fetchChiefEditors,
  fetchSubEditors,
  fetchReviewer,
  assignReviewer,
} from "../controllers/cheifEditor.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import {
  assignSubEditorSchema,
  assignReviewerSchema,
  editorDecisionSchema,
  paperStatusSchema,
} from "../schemas/cheifEditor.schema";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

router.get(
  "/getChiefEditors",
  authMiddleware,
  authorize("author", "admin", "owner", "publisher"),
  fetchChiefEditors,
);

router.get("/getPapers", authMiddleware, authorize("chief_editor"), getPapers);

router.get(
  "/getsubEditors",
  authMiddleware,
  authorize("author", "chief_editor", "owner", "publisher"),
  fetchSubEditors,
);

router.post(
  "/assignSubEditor/:paperId",
  authMiddleware,
  authorize("chief_editor"),
  validate(assignSubEditorSchema),
  assignSubEditor,
);

router.get(
  "/getReviewers",
  authMiddleware,
  authorize("author", "chief_editor", "owner", "publisher"),
  fetchReviewer,
);

router.post(
  "/assignReviewer/:paperId",
  authMiddleware,
  authorize("chief_editor", "sub_editor"),
  validate(assignReviewerSchema),
  assignReviewer,
);

router.post(
  "/decide/:paperId",
  authMiddleware,
  authorize("chief_editor"),
  validate(editorDecisionSchema),
  decidePaper,
);

router.put(
  "/updatePaperStatus/:paperId",
  authMiddleware,
  authorize("chief_editor"),
  validate(paperStatusSchema),
  updatePaperStatus,
);

export default router;
