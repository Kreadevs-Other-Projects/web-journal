import { z } from "zod";

export const assignSubEditorSchema = z.object({
  subEditorId: z.string().uuid(),
});

export const assignReviewerSchema = z.object({
  reviewerId: z.string().uuid(),
});

export const paperStatusSchema = z.object({
  status: z.enum(["under_review", "pending_revision", "accepted", "rejected"]),
});
