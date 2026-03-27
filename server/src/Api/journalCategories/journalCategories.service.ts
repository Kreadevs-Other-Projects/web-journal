import {
  getAllJournalCategories,
  createJournalCategory,
  updateJournalCategory,
  deleteJournalCategory,
  journalCategoryJournalCount,
  journalCategoryExistsBySlug,
} from "./journalCategories.repository";

function toSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export const listJournalCategoriesService = () => getAllJournalCategories();

export const addJournalCategoryService = async (name: string, description: string | null, userId: string) => {
  if (!name?.trim()) throw new Error("Category name is required");
  const slug = toSlug(name);
  if (!slug) throw new Error("Invalid category name");
  const exists = await journalCategoryExistsBySlug(slug);
  if (exists) throw new Error("A category with this name already exists");
  return createJournalCategory(name.trim(), slug, description || null, userId);
};

export const editJournalCategoryService = async (id: string, name: string, description: string | null) => {
  if (!name?.trim()) throw new Error("Category name is required");
  const slug = toSlug(name);
  if (!slug) throw new Error("Invalid category name");
  const exists = await journalCategoryExistsBySlug(slug, id);
  if (exists) throw new Error("A category with this name already exists");
  const row = await updateJournalCategory(id, name.trim(), slug, description || null);
  if (!row) throw new Error("Category not found");
  return row;
};

export const removeJournalCategoryService = async (id: string) => {
  const count = await journalCategoryJournalCount(id);
  if (count > 0) throw new Error(`Cannot delete: ${count} journal(s) are using this category`);
  const deleted = await deleteJournalCategory(id);
  if (!deleted) throw new Error("Category not found");
};
