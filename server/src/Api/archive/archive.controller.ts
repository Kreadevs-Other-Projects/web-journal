import { Request, Response } from "express";
import { getArchiveService, getArchiveFiltersService } from "./archive.service";

export const getArchive = async (req: Request, res: Response) => {
  try {
    const result = await getArchiveService(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch archive" });
  }
};

export const getArchiveFilters = async (req: Request, res: Response) => {
  try {
    const filters = await getArchiveFiltersService();
    res.json({ success: true, ...filters });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch filters" });
  }
};
