import { Router } from "express";
import { getCategories, createCategoryHandler, deleteCategoryHandler } from "./categories.controller";
import { authMiddleware, authorize } from "../../middlewares/auth.middleware";

const router = Router();

// Public: list all categories
router.get("/", getCategories);

// Publisher only: create / delete
router.post("/", authMiddleware, authorize("publisher"), createCategoryHandler);
router.delete("/:id", authMiddleware, authorize("publisher"), deleteCategoryHandler);

export default router;
