import { Router } from "express";
import {
  getJournalCategories,
  createJournalCategoryHandler,
  updateJournalCategoryHandler,
  deleteJournalCategoryHandler,
} from "./journalCategories.controller";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";

const router = Router();

// Public: list all journal categories with journal counts
router.get("/", getJournalCategories);

// Publisher only: create / update / delete
router.post("/", authMiddleware, authorize("publisher"), createJournalCategoryHandler);
router.patch("/:id", authMiddleware, authorize("publisher"), updateJournalCategoryHandler);
router.delete("/:id", authMiddleware, authorize("publisher"), deleteJournalCategoryHandler);

export default router;
