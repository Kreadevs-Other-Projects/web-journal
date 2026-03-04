import { z } from "zod";

export const zPublisherIssueSchema = z.object({
  year: z
    .number()
    .int("Year must be a whole number")
    .min(2000, "Year must be 2000 or later"),

  volume: z
    .number()
    .int("Volume must be a whole number")
    .min(1, "Volume must be at least 1"),

  issue: z
    .number()
    .int("Issue must be a whole number")
    .min(1, "Issue must be at least 1"),

  label: z
    .string()
    .min(3, "Label must be at least 3 characters")
    .max(100, "Label cannot exceed 100 characters"),
});
