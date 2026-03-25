import { Request, Response } from "express";
import { applyAsReviewerService } from "./contact.service";

export const applyAsReviewer = async (req: Request, res: Response) => {
  try {
    const { journalId, name, email, statement, affiliation, orcid } = req.body;

    if (!journalId || !name || !email) {
      return res.status(400).json({ success: false, message: "journalId, name and email are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    // Parse array fields (sent as JSON strings or repeated fields)
    let degrees: string[] = [];
    let keywords: string[] = [];

    if (req.body.degrees) {
      degrees = Array.isArray(req.body.degrees)
        ? req.body.degrees
        : JSON.parse(req.body.degrees);
    }
    if (req.body.keywords) {
      keywords = Array.isArray(req.body.keywords)
        ? req.body.keywords
        : JSON.parse(req.body.keywords);
    }

    if (keywords.length > 5) {
      return res.status(400).json({ success: false, message: "Maximum 5 keywords allowed" });
    }
    if (degrees.length > 5) {
      return res.status(400).json({ success: false, message: "Maximum 5 degrees allowed" });
    }

    const profilePicPath = req.file?.path;

    const result = await applyAsReviewerService({
      journalId,
      name,
      email,
      degrees,
      keywords,
      statement,
      affiliation,
      orcid,
      profilePicPath,
    });

    res.json({
      success: true,
      message: "Application submitted successfully",
      journalName: result.journalName,
    });
  } catch (e: any) {
    const status = e.message === "Journal not found" ? 404 : 500;
    res.status(status).json({ success: false, message: e.message });
  }
};
