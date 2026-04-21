import { Request, Response } from "express";
import { getApprovalDetailsService, processApprovalService } from "./paperApproval.service";

export const getApprovalDetails = async (req: Request, res: Response) => {
  const { token } = req.params;
  const data = await getApprovalDetailsService(token);
  if (!data) return res.status(404).json({ success: false, message: "Approval link not found" });
  res.json({ success: true, ...data });
};

export const processApproval = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { action, reason } = req.body;

  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ success: false, message: "Invalid action. Use approve or reject." });
  }
  if (action === "reject" && !reason?.trim()) {
    return res.status(400).json({ success: false, message: "A reason is required when rejecting." });
  }

  await processApprovalService(token, action, reason);
  res.json({ success: true, message: action === "approve" ? "Paper approved and submitted." : "Paper rejected." });
};
