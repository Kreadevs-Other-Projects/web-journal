import { Router } from "express";
import {
  getJournals,
  getJournal,
  updateJournal,
  deleteJournal,
} from "../controllers/journal.controller";

const router = Router();

router.get("/journal", getJournals);
router.get("/journal/:id", getJournal);
router.put("/journal/:id", updateJournal);
router.delete("/journal/:id", deleteJournal);

export default router;
