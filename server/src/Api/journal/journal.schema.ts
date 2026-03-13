import { z } from "zod";

export const createJournalSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, { message: "Journal name must be at least 3 characters" })
      .max(255, { message: "Journal name cannot exceed 255 characters" }),
    acronym: z
      .string()
      .length(4, { message: "Acronym must be exactly 4 characters" })
      .regex(/^[A-Z]{4}$/, {
        message: "Acronym must contain exactly 4 capital letters",
      }),
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

const staffMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const publisherCreateJournalSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, "Journal name must be at least 3 characters")
      .max(255, "Journal name cannot exceed 255 characters"),
    acronym: z
      .string()
      .min(1, "Acronym is required")
      .max(10, "Acronym cannot exceed 10 characters"),
    issn: z
      .string()
      .regex(/^\d{4}-\d{3}[\dxX]$/, "ISSN must be in the format 1234-567X")
      .optional()
      .or(z.literal("")),
    doi: z.string().optional().nullable(),
    publisher_name: z.string().min(1, "Publisher name is required"),
    type: z.enum(["open_access", "subscription"]),
    peer_review_policy: z.string().min(1, "Peer review policy is required"),
    oa_policy: z.string().min(1, "OA policy is required"),
    author_guidelines: z.string().min(1, "Author guidelines are required"),
    aims_and_scope: z.string().optional().nullable(),
    publication_fee: z.number().optional().nullable(),
    currency: z.enum(["USD", "PKR"]).optional().nullable(),
    chief_editor: staffMemberSchema,
    journal_manager: staffMemberSchema,
  }),
});
