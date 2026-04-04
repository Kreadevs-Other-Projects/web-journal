import { Router } from "express";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { getConferences, createConference, deleteConference } from "./conference.controller";

const router = Router();

router.get("/", asyncHandler(getConferences));
router.post("/", authMiddleware, authorize("publisher"), asyncHandler(createConference));
router.delete("/:id", authMiddleware, authorize("publisher"), asyncHandler(deleteConference));

export default router;
