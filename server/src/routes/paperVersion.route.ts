import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middlewares/validate.middleware";
import {
  createPaperVersion,
  getPaperVersions,
} from "../controllers/paperVersion.controller";
import { createPaperVersionSchema } from "../schemas/paperVersion.schema";

const router = Router();

router.post(
  "/createPaperVersion",
  validate(createPaperVersionSchema),
  asyncHandler(createPaperVersion)
);

router.get("getPaperVersions/:paperId", asyncHandler(getPaperVersions));

export default router;
