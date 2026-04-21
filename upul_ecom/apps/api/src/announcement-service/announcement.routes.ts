import { Router } from 'express';
import { 
  getAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement 
} from './announcement.controller'; 
import isAuthenticated from '../../../../packages/middleware/isAuthenticated';
import { isAdmin } from '../../../../packages/middleware/authorizedRoles';

const router = Router();

// Public route (used by the Header)
router.get('/', getAnnouncements);

// Protected routes (used by Admin UI)
router.use(isAuthenticated, isAdmin);
router.post('/', createAnnouncement);
router.put('/:id', updateAnnouncement);
router.delete('/:id', deleteAnnouncement);

export default router;
