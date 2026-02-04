// src/routes/journalRoutes.ts
import { Router } from "express";
import { getAuthorJournals } from "../controllers/author.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";

const router = Router();

router.get(
  "/getAuthorJournals",
  authMiddleware,
  authorize("author"),
  getAuthorJournals,
);

export default router;
