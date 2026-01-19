import { z } from "zod";

export const assignReviewerSchema = z.object({
  body: z.object({
    reviewer_id: z.string().uuid(),
  }),
});
