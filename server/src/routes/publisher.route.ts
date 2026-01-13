import { Router } from "express";
import {
  addJournal,
  getPublisherJournal,
} from "../controllers/publisher.controller";

const router = Router();

router.post("/journals/:id", addJournal);
router.get("/journal/:id", getPublisherJournal);

export default router;
