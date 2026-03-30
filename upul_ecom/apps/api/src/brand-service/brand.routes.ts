import { Router } from 'express';
import { getBrands, createBrand , deleteBrand, updateBrand } from './brand.controller';
import isAuthenticated from '../../../../packages/middleware/isAuthenticated';
import { isAdmin } from '../../../../packages/middleware/authorizedRoles';

const router = Router();

router.get('/', getBrands);

router.use(isAuthenticated);

router.post('/',isAdmin, createBrand);
router.delete('/:id',isAdmin, deleteBrand);
router.put('/:id',isAdmin, updateBrand);

export default router;