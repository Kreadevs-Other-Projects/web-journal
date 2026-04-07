import jwt from "jsonwebtoken";
import { env } from "../configs/envs";

export interface UserRoleContext {
  role: string;
  journal_id: string | null;
  journal_name: string | null;
}

export const generateAccessToken = async (
  userId: string,
  role: string = "user",
  email?: string,
  username?: string,
  roles?: UserRoleContext[],
  active_role?: string,
  active_journal_id?: string | null,
  profile_completed?: boolean,
) => {
  return jwt.sign(
    {
      id: userId,
      role,
      email,
      username,
      roles: roles ?? [{ role, journal_id: null, journal_name: null }],
      active_role: active_role ?? role,
      active_journal_id: active_journal_id ?? null,
      profile_completed: profile_completed ?? true,
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
    roles: UserRoleContext[];
    active_role: string;
    active_journal_id: string | null;
    profile_completed: boolean;
  };
};
