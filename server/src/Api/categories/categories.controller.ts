import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  listCategoriesService,
  addCategoryService,
  removeCategoryService,
} from "./categories.service";
import { AuthUser } from "../../middlewares/auth.middleware";

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listCategoriesService();
  return res.json({ success: true, categories });
});

export const createCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthUser).user!;
  const { name } = req.body;
  const category = await addCategoryService(name, user.id);
  return res.status(201).json({ success: true, category });
});

export const deleteCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await removeCategoryService(id);
  return res.json({ success: true, message: "Category deleted" });
});
