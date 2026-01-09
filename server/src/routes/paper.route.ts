import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate.middleware";
import { createPaper, getPaperById } from "../controllers/paper.controller";
import { createPaperSchema } from "../schemas/paper.schema";

const router = Router();

router.post(
  "/createPaper",
  authMiddleware,
  validate(createPaperSchema),
  asyncHandler(createPaper)
);

router.get("getPaper/:id", authMiddleware, asyncHandler(getPaperById));

export default router;
