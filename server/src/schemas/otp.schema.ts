import { z } from "zod";

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
