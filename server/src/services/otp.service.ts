import {
  saveOTP as saveOTPRepo,
  findOTP as findOTPRepo,
  deleteOTP as deleteOTPRepo,
} from "../repositories/otp.repository";

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createOTP = async (email: string) => {
  const otpCode = generateOTP();

  return await saveOTPRepo(email, otpCode);
};

export const verifyOTP = async (email: string, otpCode: string) => {
  return await findOTPRepo(email, otpCode);
};

export const deleteOTP = async (email: string) => {
  return await deleteOTPRepo(email);
};
