import { z } from "zod";

export const assignSubEditorSchema = z.object({
  body: z.object({
    subEditorId: z.string().min(1, "Sub-editor ID is required"),
  }),
  params: z.object({
    paperId: z.string().min(1, "Paper ID is required"),
  }),
});

export const assignReviewerSchema = z.object({
  body: z.object({
    reviewerId: z.string().uuid("Reviewer ID must be a valid UUID"),
  }),
  params: z.object({
    paperId: z.string().uuid("Paper ID must be a valid UUID"),
  }),
});

export const editorDecisionSchema = z.object({
  decision: z.enum(["pending_revision", "accepted", "rejected"]),
  decision_note: z.string().min(5),
});

export const paperStatusSchema = z.object({
  status: z.enum(["under_review", "pending_revision", "accepted", "rejected"]),
});
