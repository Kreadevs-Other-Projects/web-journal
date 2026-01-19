import { Router } from "express";
import {
  addJournal,
  getOwnerJournal,
} from "../controllers/publisher.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createJournalSchema,
  getOwnerJournalSchema,
} from "../schemas/publisher.schema";

const router = Router();

router.post(
  "/journals",
  authMiddleware,
  authorize("owner"),
  validate(createJournalSchema),
  addJournal,
);

router.get(
  "/journal/:id",
  authMiddleware,
  authorize("owner"),
  validate(getOwnerJournalSchema),
  getOwnerJournal,
);

export default router;
