import { Router } from "express";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { publishPaper } from "../controllers/publication.controller";
import { publishPaperSchema } from "../schemas/publication.schema";

const router = Router();

router.post(
  "/publishPaper/:paperId",
  authMiddleware,
  authorize("owner", "publisher"),
  validate(publishPaperSchema),
  publishPaper,
);

export default router;
