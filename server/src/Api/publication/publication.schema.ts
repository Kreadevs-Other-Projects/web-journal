import { z } from "zod";

export const publishPaperSchema = z.object({
  body: z.object({
    year_label: z.string().optional(),
    issueId: z.string().uuid("Invalid Issue ID"),
    doi: z.string().min(1, "DOI is required"),
  }),
});
