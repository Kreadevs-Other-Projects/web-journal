import { z } from "zod";

export const publishPaperSchema = z.object({
  body: z.object({
    issue_id: z.string().uuid("Invalid Issue ID, must be a valid UUID"),

    year_label: z.string().optional(),
  }),
});
