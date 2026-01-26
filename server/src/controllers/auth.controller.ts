import { Request, Response } from "express";
import {
  findUserByEmail,
  findUserById,
  hashPassword,
  createUser,
  validatePassword,
  createUserProfile,
} from "../services/auth.service";
import {
  createOTP,
  verifyOTP,
  checkOTPVerified,
  deleteOTP,
} from "../services/otp.service";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import {
  deleteRefreshToken,
  findRefreshToken,
  saveRefreshToken,
} from "../repositories/auth.repository";
import { sendOTPEmail } from "../services/email.service";
import { env } from "../configs/envs";

export const login = async (req: Request, res: Response) => {
  const { email, password, role, purpose } = req.body;

  if (!email || !password || !role || !purpose) {
    return res.status(400).json({
      success: false,
      message: "Email, password, role and purpose are required",
    });
  }

  if (!["login", "signup", "reset"].includes(purpose)) {
    return res.status(400).json({
      success: false,
      message: "Invalid purpose",
    });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Account not found!",
    });
  }

  const isValid = await validatePassword(password, user.password);
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: "Invalid password!",
    });
  }

  if (user.role !== role) {
    return res.status(403).json({
      success: false,
      message: "Invalid role selected for this account",
    });
  }

  const otp = await createOTP(email, purpose);

  await sendOTPEmail(email, otp.otp_code);

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    expiresAt: otp.expiry_at,
  });
};

export const signup = async (req: Request, res: Response) => {
  const { email, password, username, role } = req.body;

  const otpVerified = await checkOTPVerified(email);
  if (!otpVerified) {
    return res
      .status(403)
      .json({ success: false, message: "Email not verified via OTP" });
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    return res
      .status(409)
      .json({ success: false, message: "User already exists" });
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await createUser({
    email,
    password: hashedPassword,
    username,
    role,
  });

  await createUserProfile(newUser.id);

  await deleteOTP(email);

  return res.status(201).json({ success: true, message: "Signup successful" });
};

export const verify = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const otpRecord = await verifyOTP(email, otp);

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }

  return res.status(200).json({
    success: true,
    message: "OTP verified successfully",
  });
};

export const requestOTP = async (req: Request, res: Response) => {
  const { email, purpose } = req.body;

  if (!email || !purpose) {
    return res.status(400).json({
      success: false,
      message: "Email and purpose are required",
    });
  }

  if (purpose !== "signup") {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }
  }

  const otp = await createOTP(email, purpose);

  await sendOTPEmail(email, otp.otp_code);

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    expiresAt: otp.expiry_at,
  });
};

export const verifyLoginOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const otpRecord = await verifyOTP(email, otp);
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    await deleteOTP(email);

    const accessToken = await generateAccessToken(
      user.id,
      user.role,
      user.email,
      user.username,
    );
    const refreshToken = await generateRefreshToken(user.id, user.role);

    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7);

    const savedTokenId = await saveRefreshToken(
      user.id,
      refreshToken,
      expires_at,
    );
    if (!savedTokenId) {
      return res.status(500).json({
        success: false,
        message: "Failed to save refresh token",
      });
    }

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const resendOTP = async (req: Request, res: Response) => {
  const { email, purpose } = req.body;

  const user = await findUserByEmail(email);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "No account found with this email",
    });
  }

  const otp = await createOTP(email, purpose);

  await sendOTPEmail(email, otp.otp_code);

  return res.status(200).json({
    success: true,
    message: "OTP resent successfully to your email",
    expiresAt: otp.expiry_at,
  });
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }

  const storedToken = await findRefreshToken(refreshToken);
  if (!storedToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token not found or expired",
    });
  }

  const user = await findUserById(storedToken.user_id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const newAccessToken = await generateAccessToken(user.id, user.role);

  return res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    token: newAccessToken,
  });
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required",
    });
  }

  const deletedId = await deleteRefreshToken(refreshToken);

  if (!deletedId) {
    return res.status(404).json({
      success: false,
      message: "Refresh token not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};
