import { Router } from 'express';
import warehouseInventoryBatchController from '../controllers/WarehouseInventoryBatchController';

const router = Router();

router.get('/permissions', warehouseInventoryBatchController.getUserPermissions);
router.get('/query', warehouseInventoryBatchController.queryInventory);
router.post('/batch-count', warehouseInventoryBatchController.batchCount);
router.post('/batch-transfer', warehouseInventoryBatchController.batchTransfer);
router.post('/batch-alert', warehouseInventoryBatchController.batchLowStockAlert);
router.post('/batch-import', warehouseInventoryBatchController.batchImportCount);
router.post('/refresh', warehouseInventoryBatchController.getRefreshData);

export default router;
