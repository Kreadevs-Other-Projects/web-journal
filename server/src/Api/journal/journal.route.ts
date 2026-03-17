import { Router } from "express";
import {
  addJournal,
  getOwnerJournal,
  getJournals,
  getJournal,
  updateJournal,
  deleteJournal,
  publisherCreateJournal,
  uploadJournalLogo,
  getEditorialBoard,
  getAuthorGuidelines,
} from "./journal.controller";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createJournalSchema,
  getOwnerJournalSchema,
  publisherCreateJournalSchema,
} from "./journal.schema";
import { logoUpload } from "../../middlewares/upload.middleware";

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

router.post(
  "/publisherCreate",
  authMiddleware,
  authorize("publisher"),
  validate(publisherCreateJournalSchema),
  publisherCreateJournal,
);

router.post(
  "/:id/logo",
  authMiddleware,
  authorize("publisher", "journal_manager"),
  logoUpload.single("logo"),
  uploadJournalLogo,
);

router.get("/:id/editorial-board", getEditorialBoard);
router.get("/:id/guidelines", getAuthorGuidelines);

export default router;
