import { z } from "zod";

export const zPublisherIssueSchema = z.object({
  year: z.number().int().min(2000),
  volume: z.number().int().min(1),
  issue: z.number().int().min(1),
  label: z.string().min(3).max(100),
});
