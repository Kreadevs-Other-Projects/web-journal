import { Router } from "express";
import { validate } from "../middlewares/validate.middleware";
import {
  uploadPaperVersion,
  getPaperVersions,
} from "../controllers/paperVersion.controller";
import { createPaperVersionSchema } from "../schemas/paperVersion.schema";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/uploadPaperVersion/:paperId",
  authMiddleware,
  authorize("publisher"),
  validate(createPaperVersionSchema),
  uploadPaperVersion,
);

router.get("/getPaperVersions/:paperId", authMiddleware, getPaperVersions);

export default router;
