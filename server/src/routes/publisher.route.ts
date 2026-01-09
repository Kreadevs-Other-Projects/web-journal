import { Router } from "express";
import {
  addJournal,
  getPublisherJournal,
} from "../controllers/publisher.controller";

const router = Router();

router.post("/publisher/journals/:id", addJournal);
router.get("/publisher/journal/:id", getPublisherJournal);
