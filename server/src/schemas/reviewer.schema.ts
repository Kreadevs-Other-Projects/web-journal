import { z } from "zod";

export const zSubmitReviewSchema = z.object({
  decision: z.enum(["accept", "minor_revision", "major_revision", "reject"]),
  comments: z.string().min(5),
});
