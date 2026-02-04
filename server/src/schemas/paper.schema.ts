import { z } from "zod";

export const createPaperSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters long")
      .max(255, "Title cannot exceed 255 characters"),

    abstract: z
      .string()
      .min(10, "Abstract must be at least 10 characters long"),

    category: z.string().optional(),

    keywords: z
      .array(z.string())
      .min(1, "At least one keyword is required")
      .refine((arr) => arr.every((k) => k.trim().length > 0), {
        message: "Keywords cannot be empty",
      }),

    journal_id: z.string().uuid("Invalid Journal ID"),
    issue_id: z.string().uuid("Invalid Issue ID").optional(),
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
