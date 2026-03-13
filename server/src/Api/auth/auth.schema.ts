import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["author", "reviewer", "publisher"]),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
    role: z
      .enum([
        "author",
        "reviewer",
        "publisher",
        "journal_manager",
        "chief_editor",
        "sub_editor",
      ])
      .optional(),
    purpose: z.string().optional(),
  }),
});

export const createOTPSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
  }),
});

export const verifyOTPSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    otp: z.string().length(6, "OTP must be 6 digits"),
  }),
});

export const resendOTPSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

export const createStaffSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["sub_editor", "reviewer", "chief_editor", "journal_manager"]),
    journal_id: z.string().uuid("Valid journal ID is required").optional().nullable(),
    keywords: z.array(z.string()).max(5).optional(),
    degrees: z.array(z.string()).optional(),
  }),
});

export const switchRoleSchema = z.object({
  body: z.object({
    role: z.enum([
      "author",
      "chief_editor",
      "sub_editor",
      "reviewer",
      "owner",
      "publisher",
      "journal_manager",
    ]),
    journal_id: z.string().uuid("Invalid journal ID").optional().nullable(),
  }),
});
