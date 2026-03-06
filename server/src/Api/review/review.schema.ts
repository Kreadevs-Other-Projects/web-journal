import { z } from "zod";

export const submitReviewSchema = z.object({
  decision: z.enum(["accept", "minor_revision", "major_revision", "reject"]),
  comments: z.string().optional(),
  signature_url: z.string().url().optional(),
});
