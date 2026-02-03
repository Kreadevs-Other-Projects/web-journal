import { Request, Response } from "express";
import {
  createChiefEditorService,
  fetchChiefEditors,
  fetchPublishers,
} from "../services/owner.service";
import { sendWelcomeEmail } from "../utils/email";

export const getPublishers = async (req: Request, res: Response) => {
  const publishers = await fetchPublishers();
  return res.status(200).json({ success: true, data: publishers });
};

export const getChiefEditors = async (req: Request, res: Response) => {
  const chiefEditors = await fetchChiefEditors();
  return res.status(200).json({ success: true, data: chiefEditors });
};

export const createChiefEditor = async (req: Request, res: Response) => {
  try {
    const { username, email } = req.body;

    const result = await createChiefEditorService(username, email);

    try {
      await sendWelcomeEmail(email, username, result.generatedPassword);
    } catch (err) {
      console.error("Failed to send welcome email:", err);
    }

    return res.status(201).json({
      success: true,
      message: "Chief Editor created successfully",
      data: result.user,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Invalid request",
    });
  }
};
