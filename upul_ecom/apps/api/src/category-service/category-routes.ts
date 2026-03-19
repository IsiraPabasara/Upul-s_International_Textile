import { Router } from "express";
import {
  createCategory,
  getCategories,
  deleteCategory,
  updateCategory,
  reorderCategories,
  getCategoryPath
} from "./category.controller";

const router = Router();

router.put("/reorder", reorderCategories);
router.post("/", createCategory);
router.get("/", getCategories);
router.delete("/:id", deleteCategory);
router.put("/:id", updateCategory);
// ... existing routes
router.get("/path/:id", getCategoryPath); // 👈 Add this

export default router;
