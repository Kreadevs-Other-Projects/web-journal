import { Router } from "express";
import { getPublishers } from "../controllers/owner.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.get(
  "/getPublishers",
  authMiddleware,
  authorize("admin", "owner"),
  getPublishers,
);

export default router;
