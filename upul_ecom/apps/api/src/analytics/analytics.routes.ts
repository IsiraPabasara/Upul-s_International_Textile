import { Router } from "express";
import {getDashboardStats, getTopProducts,getTopCustomers} from "./analytics.controller";
import { isAdmin } from "../../../../packages/middleware/authorizedRoles";
import isAuthenticated from "../../../../packages/middleware/isAuthenticated";

const router = Router();

router.use(isAuthenticated);

router.use(isAdmin);

router.get("/overview", getDashboardStats);
router.get("/top-products", getTopProducts);
router.get("/top-customers", getTopCustomers);

export default router;