import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../configs/envs";
import type { RoleEntry } from "../utils/jwt";

const ACCESS_TOKEN = env.JWT_SECRET as string;

export interface AuthUser extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    roles: RoleEntry[];
    active_journal_id: string | null;
  };
  file?: Express.Multer.File;
}

interface TokenPayload extends JwtPayload {
  id: string;
  email: string;
  username: string;
  role: string;
  roles?: RoleEntry[];
  active_role?: string;
  active_journal_id?: string | null;
}

export const authMiddleware = (
  req: AuthUser,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization token missing",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN, {
      algorithms: ["HS256"],
    }) as TokenPayload;

    req.user = {
      id: payload.id,
      email: payload.email,
      username: payload.username,
      // active_role is the session role; fall back to primary role for old tokens
      role: payload.active_role ?? payload.role,
      roles: payload.roles ?? [{ role: payload.role, journal_id: null, journal_name: null }],
      active_journal_id: payload.active_journal_id ?? null,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthUser, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Insufficient role",
      });
    }

    next();
  };
};
