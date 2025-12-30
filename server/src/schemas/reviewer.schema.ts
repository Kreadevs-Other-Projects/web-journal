import { z } from "zod";

export const updateReviewerProfileSchema = z.object({
  certification: z.string().min(1, "Certification is required"),
  qualifications: z
    .array(z.string().min(1, "Each qualification must be a non-empty string"))
    .min(1, "Qualifications must have at least one item"),
});

export type UpdateReviewerProfileSchema = z.infer<
  typeof updateReviewerProfileSchema
>;
