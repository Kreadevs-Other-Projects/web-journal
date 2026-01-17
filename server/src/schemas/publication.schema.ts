import { z } from "zod";

export const publishPaperSchema = z.object({
  issue_id: z.string().uuid(),
  year_label: z.string().optional(),
});
