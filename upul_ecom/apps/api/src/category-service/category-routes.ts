import { Router } from "express";
import {
  createCategory,
  getCategories,
  deleteCategory,
  updateCategory,
  reorderCategories,
  getCategoryPath
} from "./category.controller";
import isAuthenticated from "../../../../packages/middleware/isAuthenticated";
import { isAdmin } from "../../../../packages/middleware/authorizedRoles";

const router = Router();

router.get("/", getCategories);
router.get("/path/:id", getCategoryPath);

router.use(isAuthenticated);

router.put("/reorder", isAdmin, reorderCategories);
router.post("/", isAdmin,createCategory);
router.delete("/:id",isAdmin ,deleteCategory);
router.put("/:id",isAdmin, updateCategory);

export default router;