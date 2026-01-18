import { z } from "zod";

export const createPaperSchema = z.object({
  body: z.object({
    title: z.string().min(5),
    abstract: z.string().optional(),
    category: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    journal_id: z.string().uuid(),
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
