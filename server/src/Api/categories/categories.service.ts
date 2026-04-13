import {
  getAllCategories,
  createCategory,
  deleteCategoryById,
  categoryExistsBySlug,
} from "./categories.repository";

function toSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export const listCategoriesService = async () => {
  return getAllCategories();
};

export const addCategoryService = async (name: string, userId: string) => {
  if (!name?.trim()) throw new Error("Category name is required");
  const slug = toSlug(name);
  if (!slug) throw new Error("Invalid category name");
  const exists = await categoryExistsBySlug(slug);
  if (exists) throw new Error("A category with this name already exists");
  return createCategory(name.trim(), slug, userId);
};

export const removeCategoryService = async (id: string) => {
  const count = await deleteCategoryById(id);
  if (!count) throw new Error("Category not found");
};
