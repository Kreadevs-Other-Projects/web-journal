import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.issues.map((err) => {
            const path = err.path.join(".");
            // Strip leading "body." so field names match frontend field names
            const field = path.startsWith("body.") ? path.slice(5) : path;
            return { field, message: err.message };
          }),
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }
  };
};
