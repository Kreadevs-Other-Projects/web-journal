import { Response, NextFunction } from "express";
import { AuthUser } from "./auth.middleware";

export const requireProfileCompleted = (
  req: AuthUser,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.profile_completed) {
    return res.status(403).json({
      success: false,
      message: "Please complete your profile before performing this action.",
      code: "PROFILE_INCOMPLETE",
    });
  }
  next();
};
