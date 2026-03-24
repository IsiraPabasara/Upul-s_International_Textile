import { Router } from 'express';
import isAuthenticated from '../../../../packages/middleware/isAuthenticated';
import { getWishlist, mergeWishlist, toggleWishlistItem } from './wishlist.controller';


const router = Router();

router.use(isAuthenticated);

router.get('/', getWishlist);
router.post('/toggle', toggleWishlistItem);
router.post('/merge', mergeWishlist);


export default router;