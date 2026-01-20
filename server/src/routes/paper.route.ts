import { Router } from "express";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate.middleware";
import {
  createPaper,
  getAllPapers,
  updatePaperStatus,
  getPapersByAuthor,
} from "../controllers/paper.controller";
import { createPaperSchema, updatePaperSchema } from "../schemas/paper.schema";

const router = Router();

router.post(
  "/createPaper",
  authMiddleware,
  authorize("author"),
  validate(createPaperSchema),
  createPaper,
);

router.get("/getAllPapers", authMiddleware, getAllPapers);

router.get(
  "/getPapersByAuthor",
  authMiddleware,
  authorize("author"),
  getPapersByAuthor,
);

router.patch(
  "/updatePaperStatus/:paperId",
  authMiddleware,
  authorize("editor", "owner"),
  validate(updatePaperSchema),
  updatePaperStatus,
);

export default router;
