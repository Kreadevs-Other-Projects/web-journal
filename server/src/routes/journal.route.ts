import { Router } from "express";
import {
  getJournals,
  getJournal,
  updateJournal,
  deleteJournal,
} from "../controllers/journal.controller";

const router = Router();

router.get("/getJournals", getJournals);
router.get("/getJournal/:id", getJournal);
router.put("/updateJournal/:id", updateJournal);
router.delete("/deleteJournal/:id", deleteJournal);

export default router;
