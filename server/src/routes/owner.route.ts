import { Router } from "express";
import {
  createChiefEditor,
  getChiefEditors,
  getPublishers,
  sendJournalExpiry,
  uploadpaymentImage,
  getPendingJournalPayment,
} from "../controllers/owner.controller";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createUserSchema } from "../schemas/owner.schema";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.get(
  "/getPublishers",
  authMiddleware,
  authorize("admin", "owner"),
  getPublishers,
);

router.get(
  "/getChief-Editor",
  authMiddleware,
  authorize("admin", "owner"),
  getChiefEditors,
);

router.post(
  "/createChiefEditor",
  authMiddleware,
  authorize("owner"),
  validate(createUserSchema),
  createChiefEditor,
);

router.post(
  "/sendJournalExpiry/:journalId",
  authMiddleware,
  authorize("owner"),
  sendJournalExpiry,
);

router.post(
  "/uploadpaymentImage/:id",
  upload.single("receipt"),
  uploadpaymentImage,
);

router.get(
  "/getPendingJournalPayment/:journalId",
  authMiddleware,
  getPendingJournalPayment,
);

export default router;
