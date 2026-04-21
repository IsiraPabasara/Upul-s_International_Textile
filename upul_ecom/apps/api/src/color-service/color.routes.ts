import { Router } from 'express';
import { getColors, createColor, deleteColor } from './color.controller';
import isAuthenticated from '../../../../packages/middleware/isAuthenticated';
import { isAdmin } from '../../../../packages/middleware/authorizedRoles';

const router = Router();

router.get('/', getColors);

router.use(isAuthenticated);

router.post('/',isAdmin, createColor);
router.delete('/:id',isAdmin, deleteColor)

export default router;