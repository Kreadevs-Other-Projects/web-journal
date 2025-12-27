import { Request, Response } from "express";
import * as AuthService from "../services/auth.service";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { saveRefreshToken } from "../repositories/auth.repository";

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

  const accessToken = await generateAccessToken(user.id);
  const refreshToken = await generateRefreshToken(user.id);

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
    token: accessToken,
  });
};
