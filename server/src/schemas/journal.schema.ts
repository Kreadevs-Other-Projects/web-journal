import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createJournalSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, { message: "Journal name must be at least 3 characters" })
      .max(255, { message: "Journal name cannot exceed 255 characters" }),
    slug: z
      .string()
      .min(3, { message: "Slug must be at least 3 characters" })
      .max(100, { message: "Slug cannot exceed 100 characters" }),
    description: z
      .string()
      .max(500, { message: "Description cannot exceed 500 characters" })
      .optional()
      .or(z.literal("")),
    issn: z.string().regex(/^\d{4}-\d{3}[\dxX]$/, {
      message: "ISSN must be in the format 1234-567X",
    }),
    website_url: z
      .string()
      .url({ message: "Website URL must be a valid URL" })
      .optional()
      .or(z.literal("")),
    chief_editor_id: z.string().uuid({ message: "Chief Editor is required" }),
  }),
});

export const getOwnerJournalSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid journal ID"),
  }),
});
