import { z } from "zod";

export const approveEditorProfileSchema = z.object({
  decision: z.enum(["accepted", "rejected"]),
});

export type ApproveEditorProfileInput = z.infer<
  typeof approveEditorProfileSchema
>;
