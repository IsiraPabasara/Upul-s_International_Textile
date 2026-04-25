import { Router } from 'express';
import isAuthenticated from '../../../../packages/middleware/isAuthenticated';
import { addToCart, getCart, mergeCart, removeCartItem, updateCartItem, verifyCart, generateCartFrequencyReport } from './cart.controller';


const router = Router();

// Report Routes (Put this BEFORE /:sku to prevent route collision)
router.get('/report', generateCartFrequencyReport);

router.post('/verify', verifyCart);
router.use(isAuthenticated);

// 1. Syncing (The "Merge" Logic)
router.post('/merge', mergeCart);

// 2. Standard Cart Operations
router.get('/', getCart);             // Fetch DB cart
router.post('/', addToCart);          // Add item to DB cart
router.put('/', updateCartItem);      // Update quantity (sku + quantity)
router.delete('/:sku', removeCartItem); // Remove specific item
export default router;