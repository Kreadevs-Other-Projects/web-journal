import { Request, Response } from "express";
import { fetchPublishers } from "../services/owner.service";

export const getPublishers = async (req: Request, res: Response) => {
  const publishers = await fetchPublishers();
  return res.status(200).json({ success: true, data: publishers });
};
