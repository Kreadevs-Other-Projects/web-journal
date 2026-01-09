import { Request, Response } from "express";

export const paperController = {
  async example(req: Request, res: Response) {
    return res.json({ message: "paper controller works" });
  }
};
