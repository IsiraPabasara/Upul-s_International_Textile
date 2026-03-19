import { Router } from 'express';
import { 
  createProduct, 
  getAllProducts, 
  getProductBySku, 
  updateProductBySku, 
  toggleVisibility, 
  deleteProduct,
  getProductCountries
} from './product.controller';
import { getShopProducts } from './shop.controller';
import { getInventory, bulkUpdateInventory } from "../inventory-service/inventory.controller";

const router = Router();

router.get('/shop', getShopProducts);

// 🟢 Fetch hardcoded countries (Put this BEFORE /:sku)
router.get('/meta/countries', getProductCountries); 

router.post('/', createProduct);
router.get('/', getAllProducts);
router.get('/:sku', getProductBySku);
router.put("/:sku", updateProductBySku);
router.patch("/:sku/visibility", toggleVisibility);
router.delete("/:sku", deleteProduct);

router.get("/inventory/list", getInventory);
router.patch("/inventory/bulk-update", bulkUpdateInventory);

export default router;