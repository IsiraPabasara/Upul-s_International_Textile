import { Router } from 'express';
import { getPaymentLogs } from './payment.log.controller';
import isAuthenticated from '../../../../packages/middleware/isAuthenticated';
import { isAdmin } from '../../../../packages/middleware/authorizedRoles';

const router = Router();

router.use(isAuthenticated , isAdmin);

router.get('/', getPaymentLogs);

export default router;