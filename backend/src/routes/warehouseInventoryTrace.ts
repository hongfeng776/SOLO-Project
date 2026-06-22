import { Router } from 'express';
import warehouseInventoryTraceController from '../controllers/WarehouseInventoryTraceController';

const router = Router();

router.get('/full-trace/:inventory_id', warehouseInventoryTraceController.getFullTrace);
router.post('/check-over-quantity', warehouseInventoryTraceController.checkOverQuantity);
router.post('/check-duplicate-batch', warehouseInventoryTraceController.checkDuplicateBatch);
router.post('/check-fake', warehouseInventoryTraceController.checkFakeInventory);

export default router;
