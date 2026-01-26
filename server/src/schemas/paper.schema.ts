import { z } from "zod";

export const createPaperSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    abstract: z.string().min(10),
    category: z.string().optional(),
    keywords: z.array(z.string()).min(1),

    journal_id: z.string().uuid(),
    chief_editor_id: z.string().uuid(),

    issue_id: z.string().uuid().optional(),
  }),
});

export const updatePaperSchema = z.object({
  body: z.object({
    status: z.enum([
      "submitted",
      "under_review",
      "accepted",
      "rejected",
      "published",
    ]),
  }),
});
