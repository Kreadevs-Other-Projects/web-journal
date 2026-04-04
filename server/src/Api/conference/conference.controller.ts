import { Request, Response } from "express";
import {
  getUpcomingConferencesRepo,
  createConferenceRepo,
  deleteConferenceRepo,
} from "./conference.repository";
import { AuthUser } from "../../middlewares/auth.middleware";

export const getConferences = async (req: Request, res: Response) => {
  const conferences = await getUpcomingConferencesRepo();
  return res.status(200).json({ success: true, conferences });
};

export const createConference = async (req: AuthUser, res: Response) => {
  const { title, date, location, link } = req.body;

  if (!title || !date) {
    return res.status(400).json({ success: false, message: "title and date are required" });
  }

  const conference = await createConferenceRepo(
    title,
    date,
    location ?? null,
    link ?? null,
    req.user!.id,
  );

  return res.status(201).json({ success: true, conference });
};

export const deleteConference = async (req: AuthUser, res: Response) => {
  const { id } = req.params;
  const deleted = await deleteConferenceRepo(id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: "Conference not found" });
  }
  return res.status(200).json({ success: true, message: "Conference deleted" });
};
