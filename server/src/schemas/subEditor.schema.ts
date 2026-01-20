import { z } from "zod";

export const zSubEditorStatusSchema = z.object({
  status: z.enum(["under_review", "pending_revision", "resubmitted"]),
});
