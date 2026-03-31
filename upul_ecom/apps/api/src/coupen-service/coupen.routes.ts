import { Router } from 'express';
import { createCoupon, deleteCoupon, getAllCoupons, toggleCouponStatus } from './admin.coupen';
import isAuthenticated from '../../../../packages/middleware/isAuthenticated';
import { isAdmin } from '../../../../packages/middleware/authorizedRoles';
import { validateCartCoupon } from './coupon.service';


const router = Router();
router.get('/', isAuthenticated, isAdmin, getAllCoupons);
router.post('/validate-coupon', validateCartCoupon);
router.post('/', isAuthenticated, isAdmin, createCoupon);
router.delete('/:id', isAuthenticated, isAdmin, deleteCoupon);
router.patch('/:id', isAuthenticated, isAdmin, toggleCouponStatus);

export default router;