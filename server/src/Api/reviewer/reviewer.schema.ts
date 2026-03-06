import { z } from "zod";

export const zSubmitReviewSchema = z.object({
  body: z.object({
    decision: z.enum([
      "accepted",
      "minor_revision",
      "major_revision",
      "rejected",
    ]),
    comments: z.string().min(5, "Comments must be at least 5 characters"),
  }),
});
