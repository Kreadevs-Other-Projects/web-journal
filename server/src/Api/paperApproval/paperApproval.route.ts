import { Router } from "express";
import { getApprovalDetails, processApproval } from "./paperApproval.controller";

const router = Router();

// Public — no auth required (CA may not have account)
router.get("/:token", getApprovalDetails);
router.post("/:token/approve", processApproval);

export default router;
