import { z } from "zod";

export const assignReviewerSchema = z.object({
  body: z.object({
    reviewerId: z.string().uuid(),
  }),
});

export const zSubEditorStatusSchema = z.object({
  body: z.object({
    status: z.enum(["under_review", "pending_revision", "resubmitted"]),
  }),
});
