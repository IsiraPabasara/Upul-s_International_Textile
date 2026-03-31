import { Router } from "express";
import {getDashboardStats, getTopProducts,getTopCustomers} from "./analytics.controller";

const router = Router();

router.get("/overview", getDashboardStats);
router.get("/top-products", getTopProducts);
router.get("/top-customers", getTopCustomers);

export default router;