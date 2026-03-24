import { Router } from "express";
import { 
  getAllSizeCharts, 
  createSizeChart, 
  deleteSizeChart, 
  updateSizeChart
} from "./sizetypes.controller";
import isAuthenticated from "../../../../packages/middleware/isAuthenticated";
import { isAdmin } from "../../../../packages/middleware/authorizedRoles";

const router = Router();

router.get("/", getAllSizeCharts);

router.use(isAuthenticated, isAdmin);

router.post("/", createSizeChart);
router.put("/:id", updateSizeChart);
router.delete("/:id", deleteSizeChart);

export default router;