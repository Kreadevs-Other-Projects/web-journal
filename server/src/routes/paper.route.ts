import { Router } from "express";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate.middleware";
import {
  createPaper,
  getAllPapers,
  updatePaperStatus,
} from "../controllers/paper.controller";
import { createPaperSchema, updatePaperSchema } from "../schemas/paper.schema";

const router = Router();

router.post(
  "/createPaper",
  authMiddleware,
  authorize("publisher"),
  validate(createPaperSchema),
  createPaper,
);

router.get("/getAllPapers", authMiddleware, getAllPapers);

router.patch(
  "/updatePaperStatus/:paperId",
  authMiddleware,
  authorize("editor", "owner"),
  validate(updatePaperSchema),
  updatePaperStatus,
);

export default router;
