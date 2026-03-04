import { Router } from 'express';
import { createProduct, getAllProducts, getProductBySku } from './product.controller';

const router = Router();

router.post('/', createProduct);
router.get('/', getAllProducts);
router.get('/:sku', getProductBySku);

export default router;