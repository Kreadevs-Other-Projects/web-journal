import { Router } from "express";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { publishPaper } from "../controllers/publication.controller";
import { publishPaperSchema } from "../schemas/publication.schema";

const router = Router();

router.put(
  "/publishPaper/:paperId",
  authMiddleware,
  authorize("chief_editor"),
  validate(publishPaperSchema),
  publishPaper,
);

export default router;
