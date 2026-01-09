import { Request, Response } from "express";
import { AuthUser } from "../middlewares/auth.middleware";
import {
  createPaperService,
  getPaperByIdService,
} from "../services/paper.service";

export const createPaper = async (req: AuthUser, res: Response) => {
  const authorId = req.user!.id;
  const paper = await createPaperService(req.body, authorId);

  res.status(201).json({
    success: true,
    message: "Paper created successfully",
    data: paper,
  });
};

export const getPaperById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const paper = await getPaperByIdService(id);

  res.status(200).json({
    success: true,
    data: paper,
  });
};
