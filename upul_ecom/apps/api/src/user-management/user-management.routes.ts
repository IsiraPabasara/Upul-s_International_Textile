import { Router } from 'express';
import isAuthenticated from '../../../../packages/middleware/isAuthenticated.js';
import {
  getAllUsers,
  getUserDetails,
  getUserOrders,
  updateUserRole,
  getUserStatistics,
  bulkUpdateUserRoles,
  generateUserReport,
} from './user-management.controller';

const router = Router();

// All routes require authentication
router.use(isAuthenticated);

// Get user statistics
router.get('/statistics', getUserStatistics);

// Generate user report
router.get('/report', generateUserReport);

// Get all users with search and pagination
router.get('/', getAllUsers);

// Get single user details
router.get('/:id', getUserDetails);

// Get user's order history
router.get('/:id/orders', getUserOrders);

// Update user role
router.put('/:id/role', updateUserRole);

// Bulk update user roles
router.post('/bulk/role-update', bulkUpdateUserRoles);

export default router;
