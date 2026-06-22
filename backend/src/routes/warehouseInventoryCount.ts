import { Router } from 'express';
import warehouseInventoryCountController from '../controllers/WarehouseInventoryCountController';

const router = Router();

router.post('/execute', warehouseInventoryCountController.executeCount);
router.post('/correction', warehouseInventoryCountController.executeCorrection);
router.post('/confirm/:inventory_id', warehouseInventoryCountController.confirmCount);
router.post('/sync', warehouseInventoryCountController.syncInventory);

export default router;
