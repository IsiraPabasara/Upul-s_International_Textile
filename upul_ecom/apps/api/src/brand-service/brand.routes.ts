import { Router } from 'express';
import { getBrands, createBrand , deleteBrand, updateBrand } from './brand.controller';

const router = Router();

router.get('/', getBrands);
router.post('/', createBrand);
router.delete('/:id', deleteBrand);
router.put('/:id', updateBrand);

export default router;