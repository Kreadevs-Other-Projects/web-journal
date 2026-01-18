import { z } from "zod";

export const createJournalIssueSchema = z.object({
  body: z.object({
    year: z.number(),
    label: z.string(),
    volume: z.number().optional(),
    issue: z.number().optional(),
    published_at: z.string().optional(),
  }),
});

export const updateJournalIssueSchema = z.object({
  body: z.object({
    year: z.number().optional(),
    label: z.string().optional(),
    volume: z.number().optional(),
    issue: z.number().optional(),
    published_at: z.string().optional(),
  }),
});

export const deleteJournalIssueSchema = z.object({
  params: z.object({
    issueId: z.string().uuid("Invalid issue ID"),
  }),
});
