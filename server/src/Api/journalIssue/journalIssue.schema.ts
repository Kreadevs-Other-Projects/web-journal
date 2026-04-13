import { z } from "zod";

export const createJournalIssueSchema = z.object({
  body: z.object({}).optional(),
});

export const updateJournalIssueSchema = z.object({
  body: z.object({
    year: z
      .number()
      .optional()
      .refine(
        (val) => val === undefined || val >= 1900,
        "Year must be at least 1900",
      )
      .refine(
        (val) => val === undefined || val <= new Date().getFullYear() + 1,
        "Year cannot be in the far future",
      ),
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
