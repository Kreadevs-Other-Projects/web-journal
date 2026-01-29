import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z
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
    .refine((data) => Object.values(data).some(Boolean), {
      message: "At least one field must be provided",
    }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(6, "Old password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
  }),
});

export const getProfileSchema = z.object({});
export const deleteProfileSchema = z.object({});
