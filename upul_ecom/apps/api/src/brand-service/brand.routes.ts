import { Router } from 'express';
import { getBrands, createBrand } from './brand.controller';

const router = Router();

router.get('/', getBrands);
router.post('/', createBrand);

export default router;