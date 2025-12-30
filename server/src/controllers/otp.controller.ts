import { Request, Response } from "express";
import * as OTPService from "../services/otp.service";
import * as EmailService from "../services/email.service";
import * as AuthService from "../services/auth.service";

export const createOTP = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await AuthService.findUserByEmail(email);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "No account found with this email",
    });
  }

  const otp = await OTPService.createOTP(email);

  await EmailService.sendOTPEmail(email, otp.otp_code);

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully to your email",
    expiresAt: otp.expiry_at,
  });
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const otpRecord = await OTPService.verifyOTP(email, otp);

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }

  await OTPService.deleteOTP(email);

  return res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    data: {
      email: otpRecord.email,
      verified: true,
    },
  });
};

export const resendOTP = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await AuthService.findUserByEmail(email);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "No account found with this email",
    });
  }

  const otp = await OTPService.createOTP(email);

  await EmailService.sendOTPEmail(email, otp.otp_code);

  return res.status(200).json({
    success: true,
    message: "OTP resent successfully to your email",
    expiresAt: otp.expiry_at,
  });
};
