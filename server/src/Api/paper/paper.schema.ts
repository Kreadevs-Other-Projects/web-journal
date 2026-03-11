import { z } from "zod";

const referenceSchema = z.object({
  text: z.string().min(1),
  link: z.string().optional(),
});

export const createPaperSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters long")
      .max(200, "Title cannot exceed 200 characters"),

    journal_id: z.string().uuid("Invalid Journal ID"),

    author_names: z
      .array(z.string().min(1))
      .min(1, "At least one author name is required"),

    corresponding_authors: z
      .array(z.string().min(1))
      .max(5, "Maximum 5 corresponding authors allowed")
      .optional()
      .default([]),

    keywords: z
      .array(z.string())
      .min(1, "At least one keyword is required")
      .max(5, "Maximum 5 keywords allowed"),

    paper_references: z
      .array(referenceSchema)
      .max(5, "Maximum 5 references allowed")
      .optional()
      .default([]),

    abstract: z.string().optional().default(""),
    category: z.string().optional(),
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
