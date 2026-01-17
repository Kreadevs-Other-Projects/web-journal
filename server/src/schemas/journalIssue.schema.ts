import { z } from "zod";

export const createJournalIssueSchema = z.object({
  year: z.number().int().min(1900),
  volume: z.number().int().positive().optional(),
  issue: z.number().int().positive().optional(),
  label: z.string().min(3),
  published_at: z.string().datetime().optional(),
});

export const updateJournalIssueSchema = createJournalIssueSchema.partial();
