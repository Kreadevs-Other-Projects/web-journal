import { z } from "zod";

export const updateProfileSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .optional(),
    email: z.string().email("Invalid email format").optional(),
  })
  .refine((data) => data.username || data.email, {
    message: "At least one field (username or email) must be provided",
  });

export const getProfileSchema = z.object({}).optional();
export const deleteProfileSchema = z.object({}).optional();

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export type GetProfileSchema = z.infer<typeof getProfileSchema>;
export type DeleteProfileSchema = z.infer<typeof deleteProfileSchema>;
