import { Router } from 'express';
import {
  getEmailQueueStatus,
  getEmailLogs, 
  getOrderEmailHistory,
  retryFailedEmailManually,
  getEmailStatistics,
  cleanupOldEmailLogs,
} from './email.controller';
import isAuthenticated from '../../../../packages/middleware/isAuthenticated';
import { isAdmin } from '../../../../packages/middleware/authorizedRoles';

const router = Router();

router.use(isAuthenticated , isAdmin);

router.get('/queue/stats', getEmailQueueStatus);
router.get('/logs', getEmailLogs);
router.get('/statistics', getEmailStatistics);
router.get('/order/:orderNumber', getOrderEmailHistory);
router.post('/retry/:emailLogId', retryFailedEmailManually);
router.delete('/cleanup', cleanupOldEmailLogs);

export default router;