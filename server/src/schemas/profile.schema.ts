import { z } from "zod";

export const updateProfileSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .optional(),
    email: z.string().email("Invalid email format").optional(),
    qualifications: z.string().nullable().optional(),
    expertise: z.array(z.string()).nullable().optional(),
    certifications: z.string().nullable().optional(),
  })
  .refine(
    (data) =>
      data.username ||
      data.email ||
      data.qualifications ||
      data.expertise ||
      data.certifications,
    {
      message: "At least one field must be provided",
    }
  );

export const getProfileSchema = z.object({}).optional();
export const deleteProfileSchema = z.object({}).optional();

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export type GetProfileSchema = z.infer<typeof getProfileSchema>;
export type DeleteProfileSchema = z.infer<typeof deleteProfileSchema>;
