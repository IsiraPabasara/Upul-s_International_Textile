import { Router } from 'express';
import {
  getEmailQueueStatus,
  getEmailLogs, 
  getOrderEmailHistory,
  retryFailedEmailManually,
  getEmailStatistics,
  cleanupOldEmailLogs,
} from './email.controller';
import { subscribeToNewsletter, unsubscribeFromNewsletter, getNewsletterStatus, toggleNewsletter } from './newsletter.controller';
import { getAdminSubscribers, toggleSubscriberAdmin, broadcastNewsletter } from './admin.newsletter.controller';
import isAuthenticated from '../../../../packages/middleware/isAuthenticated';
import { isAdmin } from '../../../../packages/middleware/authorizedRoles';

const router = Router();

// Public endpoints for newsletter (no authentication required)
router.post('/newsletter/subscribe', subscribeToNewsletter);
router.post('/unsubscribe', unsubscribeFromNewsletter);

// Protected authenticated endpoints for newsletter
router.get('/newsletter/me', isAuthenticated, getNewsletterStatus);
router.post('/newsletter/toggle', isAuthenticated, toggleNewsletter);

// Protected admin endpoints
router.use(isAuthenticated, isAdmin);

// Admin newsletter management
router.get('/newsletter/subscribers', getAdminSubscribers);
router.put('/newsletter/subscribers/:id/toggle', toggleSubscriberAdmin);
router.post('/newsletter/broadcast', broadcastNewsletter);

router.get('/queue/stats', getEmailQueueStatus);
router.get('/logs', getEmailLogs);
router.get('/statistics', getEmailStatistics);
router.get('/order/:orderNumber', getOrderEmailHistory);
router.post('/retry/:emailLogId', retryFailedEmailManually);
router.delete('/cleanup', cleanupOldEmailLogs);

export default router;