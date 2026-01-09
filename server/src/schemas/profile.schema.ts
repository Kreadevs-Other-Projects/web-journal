import { z } from "zod";

export const updateProfileSchema = z
  .object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    qualifications: z.string().nullable().optional(),

    expertise: z
      .union([
        z.array(z.string()),
        z.string().transform((val) => JSON.parse(val)),
      ])
      .optional(),

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
