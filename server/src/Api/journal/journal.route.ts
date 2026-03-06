import { Router } from "express";
import {
  addJournal,
  getOwnerJournal,
  getJournals,
  getJournal,
  updateJournal,
  deleteJournal,
} from "./journal.controller";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createJournalSchema, getOwnerJournalSchema } from "./journal.schema";

const router = Router();

router.post(
  "/addJournal",
  authMiddleware,
  authorize("owner"),
  validate(createJournalSchema),
  addJournal,
);

router.get(
  "/getOwnerJournal/:id",
  authMiddleware,
  authorize("owner"),
  validate(getOwnerJournalSchema),
  getOwnerJournal,
);

router.get("/getJournals", getJournals);
router.get("/getJournal/:id", getJournal);
router.put(
  "/updateJournal/:id",
  authMiddleware,
  authorize("owner"),
  updateJournal,
);

router.delete(
  "/deleteJournal/:id",
  authMiddleware,
  authorize("owner"),
  deleteJournal,
);

export default router;
