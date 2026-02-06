import { Router } from "express";
import { authMiddleware, authorize } from "../middlewares/auth.middleware";
import { getSubEditorAssignments } from "../controllers/reviewAssignment.controller";

const router = Router();

router.get(
  "/getSubEditorAssignments",
  authMiddleware,
  authorize("sub_editor"),
  getSubEditorAssignments,
);

export default router;
