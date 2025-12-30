import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Request body:", req.body);
      schema.parse(req.body);
      next();
    } catch (error) {
      console.log("Validation error:", error);

      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors,
        });
      }

      return res.status(400).json({
        success: false,
        message: "Validation error",
      });
    }
  };
};
