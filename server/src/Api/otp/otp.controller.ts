import { Request, Response } from "express";
import * as OTPService from "./otp.service";
import * as EmailService from "../services/email.service";
import * as AuthService from "../auth/auth.service";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";
import { saveRefreshToken } from "../auth/auth.repository";
import { env } from "../../configs/envs";

export const createOTP = async (req: Request, res: Response) => {
  const { email, purpose } = req.body;

  if (!email || !purpose) {
    return res.status(400).json({
      success: false,
      message: "Email and purpose are required",
    });
  }

  if (purpose !== "signup") {
    const user = await AuthService.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }
  }

  const otp = await OTPService.createOTP(email, purpose);

  await EmailService.sendOTPEmail(email, otp.otp_code);

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    expiresAt: otp.expiry_at,
  });
};

export const verifyLoginOTP = async (req: Request, res: Response) => {
  try {
    console.log("===== OTP Verification API hit =====");
    console.log("Request body:", req.body);

    const { email, otp } = req.body;

    if (!email || !otp) {
      console.warn("Missing email or OTP");
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // 1️⃣ Verify OTP
    const otpRecord = await OTPService.verifyOTP(email, otp);
    console.log("OTP record found:", otpRecord);

    if (!otpRecord) {
      console.warn("Invalid or expired OTP for email:", email);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // 2️⃣ Find user
    const user = await AuthService.findUserByEmail(email);
    console.log("User found:", user);

    if (!user) {
      console.warn("No account found for email:", email);
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    // 3️⃣ Delete used OTP
    await OTPService.deleteOTP(email);
    console.log("OTP deleted for email:", email);

    // 4️⃣ Generate tokens
    const accessToken = await generateAccessToken(user.id, user.role);
    const refreshToken = await generateRefreshToken(user.id, user.role);
    console.log("AccessToken:", accessToken);
    console.log("RefreshToken:", refreshToken);

    // 5️⃣ Save refresh token
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7);

    const savedTokenId = await saveRefreshToken(
      user.id,
      refreshToken,
      expires_at,
    );
    console.log("Refresh token saved with ID:", savedTokenId);

    if (!savedTokenId) {
      console.error("Failed to save refresh token");
      return res.status(500).json({
        success: false,
        message: "Failed to save refresh token",
      });
    }

    // 6️⃣ Set cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    console.log("Refresh token cookie set");

    // 7️⃣ Respond
    console.log("Sending success response for email:", email);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const resendOTP = async (req: Request, res: Response) => {
  const { email, purpose } = req.body;

  const user = await AuthService.findUserByEmail(email);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "No account found with this email",
    });
  }

  const otp = await OTPService.createOTP(email, purpose);

  await EmailService.sendOTPEmail(email, otp.otp_code);

  return res.status(200).json({
    success: true,
    message: "OTP resent successfully to your email",
    expiresAt: otp.expiry_at,
  });
};
