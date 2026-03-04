import { Router } from 'express';
import { createCategory, getCategories, deleteCategory } from './category.controller';

const router = Router();

router.post('/', createCategory);
router.get('/', getCategories);
router.delete('/:id', deleteCategory);

export default router;