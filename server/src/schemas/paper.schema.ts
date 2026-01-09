import { z } from "zod";

export const createPaperSchema = z.object({
  title: z.string().min(3),
  abstract: z.string().optional(),
  category: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  journal_id: z.string().uuid().optional(),
});

export const updatePaperStatusSchema = z.object({
  status: z.enum(["submitted", "under_review", "accepted", "rejected"]),
});
