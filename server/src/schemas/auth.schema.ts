import { z } from "zod";

export const signupSchema = z.object({
  username: z.string().min(3, "Username must be al least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["author", "chief-editor", "sub-editor", "reviewer", "owner"]),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const createOTPSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const resendOTPSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type SignupSchema = z.infer<typeof signupSchema>;
export type RefreshTokenSchema = z.infer<typeof refreshTokenSchema>;
export type LogoutSchema = z.infer<typeof logoutSchema>;
