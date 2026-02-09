import { Router } from "express";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import {
  getReviews,
  handleAssignmentStatus,
} from "../controllers/editorAssignment.controller";

const router = Router();

router.get("/getReviews", authMiddleware, authorize("sub_editor"), getReviews);

router.put(
  "/handleAssignmentStatus/:editorAssignmentId",
  authMiddleware,
  authorize("sub_editor"),
  handleAssignmentStatus,
);

export default router;
