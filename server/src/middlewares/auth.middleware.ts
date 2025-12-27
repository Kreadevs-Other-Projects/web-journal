import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../configs/envs";

const ACCESS_TOKEN = env.JWT_SECRET as string;

export type AuthUser = Request & { user?: { id: string; role: string } };

export const authMiddleware = async (
  req: AuthUser,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized or Missing Token" });

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN) as any;
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid Token!" });
  }
};
