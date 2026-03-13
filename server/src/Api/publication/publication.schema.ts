import { z } from "zod";

export const publishPaperSchema = z.object({
  body: z.object({
    year_label: z.string().optional(),
    issueId: z.string().uuid("Invalid Issue ID").optional(),
    doi: z.string().min(1, "DOI is required"),
  }),
});
