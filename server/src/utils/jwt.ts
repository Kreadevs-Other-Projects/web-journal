import jwt from "jsonwebtoken";
import { env } from "../configs/envs";

export const generateAccessToken = async (
  userId: string,
  role: string = "user"
) => {
  return jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_SHORT_EXPIRY,
  });
};

export const generateRefreshToken = async (
  userId: string,
  role: string = "user"
) => {
  return jwt.sign({ id: userId, role }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_LONG_EXPIRY,
  });
};

export const verifyRefreshToken = async (token: string) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};
