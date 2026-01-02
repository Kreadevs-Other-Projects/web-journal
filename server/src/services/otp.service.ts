import {
  saveOTP as saveOTPRepo,
  findOTP as findOTPRepo,
  deleteOTP as deleteOTPRepo,
  markOTPVerified,
  isEmailOTPVerified,
} from "../repositories/otp.repository";

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createOTP = async (
  email: string,
  purpose: "signup" | "login" | "reset"
) => {
  const otpCode = generateOTP();

  return await saveOTPRepo(email, otpCode, purpose);
};

export const verifyOTP = async (email: string, otpCode: string) => {
  const otp = await findOTPRepo(email, otpCode);
  if (!otp) return null;

  await markOTPVerified(email);
  return otp;
};

export const checkOTPVerified = async (email: string) => {
  return await isEmailOTPVerified(email);
};

export const deleteOTP = async (email: string) => {
  return await deleteOTPRepo(email);
};
