import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  listJournalCategoriesService,
  addJournalCategoryService,
  editJournalCategoryService,
  removeJournalCategoryService,
} from "./journalCategories.service";
import { AuthUser } from "../../middlewares/auth.middleware";

export const getJournalCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listJournalCategoriesService();
  return res.json({ success: true, categories });
});

export const createJournalCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthUser).user!;
  const { name, description } = req.body;
  const category = await addJournalCategoryService(name, description ?? null, user.id);
  return res.status(201).json({ success: true, category });
});

export const updateJournalCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const category = await editJournalCategoryService(id, name, description ?? null);
  return res.json({ success: true, category });
});

export const deleteJournalCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await removeJournalCategoryService(id);
  return res.json({ success: true, message: "Category deleted" });
});
