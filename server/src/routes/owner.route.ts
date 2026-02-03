import { Router } from "express";
import {
  createChiefEditor,
  getChiefEditors,
  getPublishers,
} from "../controllers/owner.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createUserSchema } from "../schemas/owner.schema";

const router = Router();

router.get(
  "/getPublishers",
  authMiddleware,
  authorize("admin", "owner"),
  getPublishers,
);

router.get(
  "/getChief-Editor",
  authMiddleware,
  authorize("admin", "owner"),
  getChiefEditors,
);

router.post(
  "/createChiefEditor",
  authMiddleware,
  authorize("owner"),
  validate(createUserSchema),
  createChiefEditor,
);

export default router;
