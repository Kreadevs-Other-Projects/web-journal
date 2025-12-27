import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  res.status(err?.statusCode || 500).json({
    message: err?.message || "Internal server error",
  });
}
