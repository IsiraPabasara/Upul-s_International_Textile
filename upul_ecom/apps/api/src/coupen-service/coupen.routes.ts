import { Router } from 'express';
import { 
  createCoupon, 
  deleteCoupon, 
  getAllCoupons, 
  toggleCouponStatus,
  generateCouponReport
} from './admin.coupen';
import isAuthenticated from '../../../../packages/middleware/isAuthenticated';
import { isAdmin } from '../../../../packages/middleware/authorizedRoles';
import { validateCartCoupon } from './coupon.service';

const router = Router();

router.post('/validate-coupon', validateCartCoupon);

router.use(isAuthenticated);

// 📋 Report Route MUST be placed above /:id routes
router.get('/report', isAdmin, generateCouponReport);

router.get('/', isAdmin, getAllCoupons);
router.post('/', isAdmin, createCoupon);
router.delete('/:id', isAdmin, deleteCoupon);
router.patch('/:id', isAdmin, toggleCouponStatus);

export default router;