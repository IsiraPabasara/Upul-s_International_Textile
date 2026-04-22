import { Router } from 'express';
import { 
  getActiveShippingCities, 
  getAllShippingCities, 
  createShippingCity, 
  updateShippingCity, 
  deleteShippingCity 
} from './shipping.controller';
import isAuthenticated from '../../../../packages/middleware/isAuthenticated';
import { isAdmin } from '../../../../packages/middleware/authorizedRoles';

const router = Router();

// PUBLIC: Get active cities for checkout dropdown
router.get('/', getActiveShippingCities);

// ADMIN ROUTES (Protected)
router.use(isAuthenticated);

router.get('/admin/all', isAdmin, getAllShippingCities);
router.post('/', isAdmin, createShippingCity);
router.put('/:id', isAdmin, updateShippingCity);
router.delete('/:id', isAdmin, deleteShippingCity);

export default router;
