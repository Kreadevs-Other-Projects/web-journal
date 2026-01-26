import { Router } from "express";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import {
  createPaper,
  getAllPapers,
  updatePaperStatus,
  getPapersByAuthor,
} from "../controllers/paper.controller";
import { validate } from "../middlewares/validate.middleware";
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

router.put(
  "/updatePaperStatus/:paperId",
  authMiddleware,
  authorize("editor", "owner", "admin"),
  validate(updatePaperSchema),
  updatePaperStatus,
);

export default router;
