import { Router } from 'express';
import { 
  createProduct, 
  getAllProducts, 
  getProductBySku,
  getProductBySlug,
  updateProductBySku, 
  toggleVisibility, 
  deleteProduct,
  getProductCountries,
  generateProductReport
} from './product.controller';
import { getShopProducts } from './shop.controller';
import { getInventory, bulkUpdateInventory , generateInventoryReport } from "../inventory-service/inventory.controller";
import isAuthenticated from '../../../../packages/middleware/isAuthenticated';
import { isAdmin } from '../../../../packages/middleware/authorizedRoles';

const router = Router();

router.get('/shop', getShopProducts);
router.get('/meta/countries', getProductCountries); 
router.get('/', getAllProducts); 

router.get("/inventory/list", isAuthenticated, isAdmin, getInventory);
router.patch("/inventory/bulk-update", isAuthenticated, isAdmin, bulkUpdateInventory);
router.get("/inventory/report", isAuthenticated, isAdmin, generateInventoryReport);

router.get("/report", isAuthenticated, isAdmin, generateProductReport);

router.get('/:slug', getProductBySlug);

router.get('/sku/:sku', getProductBySku);

router.use(isAuthenticated, isAdmin);

router.post('/', createProduct);
router.put("/:sku", updateProductBySku);
router.patch("/:sku/visibility", toggleVisibility);
router.delete("/:sku", deleteProduct);

export default router;