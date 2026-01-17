import { z } from "zod";

export const assignReviewerSchema = z.object({
  reviewer_id: z.string().uuid(),
});
