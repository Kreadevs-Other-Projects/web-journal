import { Router } from "express";
import {
  addJournal,
  getOwnerJournal,
} from "../controllers/publisher.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.post("/journals", authMiddleware, authorize("owner"), addJournal);

router.get("/journal/:id", getOwnerJournal);

export default router;
