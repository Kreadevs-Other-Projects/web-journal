import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createJournalSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(255),
    slug: z.string().min(3).max(100),
    description: z.string().optional().or(z.literal("")),
    issn: z.string().regex(/^\d{4}-\d{3}[\dxX]$/),
    website_url: z.string().url().optional().or(z.literal("")),
    publisher_id: z.string().uuid("Publisher is required"),
  }),
});

export const getOwnerJournalSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid journal ID"),
  }),
});
