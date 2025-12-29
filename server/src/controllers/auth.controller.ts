import { Request, Response } from "express";
import * as AuthService from "../services/auth.service";
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

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await AuthService.findUserByEmail(email);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Account not found!",
    });
  }

  const isValid = await AuthService.validatePassword(password, user.password);
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: "Invalid password!",
    });
  }

  const accessToken = await generateAccessToken(user.id, user.role);
  const refreshToken = await generateRefreshToken(user.id, user.role);

  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + 7);

  const savedTokenId = await saveRefreshToken(
    user.id,
    refreshToken,
    expires_at
  );
  if (!savedTokenId) {
    return res.status(500).json({
      success: false,
      message: "Failed to save refresh token",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token: refreshToken,
  });
};

export const signup = async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({
      success: false,
      message: "Email, password, and name are required",
    });
  }

  const existingUser = await AuthService.findUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "User already exists with this email!",
    });
  }

  const hashedPassword = await AuthService.hashPassword(password);
  const newUser = await AuthService.createUser({
    email,
    password: hashedPassword,
    username,
  });

  if (!newUser) {
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }

  const accessToken = await generateAccessToken(newUser.id, newUser.role);
  const refreshToken = await generateRefreshToken(newUser.id, newUser.role);

  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + 7);

  const savedTokenId = await saveRefreshToken(
    newUser.id,
    refreshToken,
    expires_at
  );

  if (!savedTokenId) {
    return res.status(500).json({
      success: false,
      message: "Failed to save refresh token",
    });
  }

  return res.status(201).json({
    success: true,
    message: "Signup successful",
    token: accessToken,
    user: {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
    },
  });
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

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

  const user = await AuthService.findUserById(storedToken.user_id);
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
