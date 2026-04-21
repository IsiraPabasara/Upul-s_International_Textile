import { Router } from 'express';
import { cancelGuestOrder, cancelUserOrder, createOrder, getGuestOrder, getOrderById, getUserOrders, verifyOrder } from './order.controller';
import isAuthenticated from '../../../../packages/middleware/isAuthenticated';
import { isAdmin } from '../../../../packages/middleware/authorizedRoles';
import { getAllOrders, getOrderDetails, updateOrderStatus , getAdminOrderStats , generateOrderReport } from './admin.order.controller';
import { refundOrder } from './admin.refund.controller';

const router = Router();

router.post('/', createOrder);
router.get('/track/:token', getGuestOrder);
router.patch('/track/:token/cancel', cancelGuestOrder);
router.get('/verify/:orderNumber', verifyOrder);

router.use(isAuthenticated);

router.get('/my-orders', getUserOrders);
router.get('/my-orders/:id', getOrderById);
router.patch('/my-orders/:id/cancel', cancelUserOrder);

router.use(isAdmin);

router.post('/admin/:orderId/refund', refundOrder);
router.get('/admin',getAllOrders);
router.get("/admin/stats", getAdminOrderStats);

//Report Generation
router.get('/admin/report', generateOrderReport);

router.get('/admin/:orderId', getOrderDetails);
router.patch('/admin/:orderId/status', updateOrderStatus);

export default router;