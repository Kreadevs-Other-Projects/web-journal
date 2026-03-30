import jwt from "jsonwebtoken";
import { env } from "../configs/envs";

export const generateAccessToken = async (
  userId: string,
  role: string = "user",
  email?: string,
  username?: string,
  roles?: string[],
  active_role?: string,
  active_journal_id?: string | null,
) => {
  return jwt.sign(
    {
      id: userId,
      role,
      email,
      username,
      roles: roles ?? [role],
      active_role: active_role ?? role,
      active_journal_id: active_journal_id ?? null,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_SHORT_EXPIRY },
  );
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

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET) as {
    id: string;
    role: string;
    email: string;
    username: string;
    roles: string[];
    active_role: string;
    active_journal_id: string | null;
  };
};
