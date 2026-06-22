import { Router } from 'express';
import warehouseStockValidateController from '../controllers/WarehouseStockValidateController';

const router = Router();

router.post('/validate-inbound', warehouseStockValidateController.validateInbound);
router.post('/inbound', warehouseStockValidateController.createInbound);
router.post('/validate-outbound', warehouseStockValidateController.validateOutbound);
router.post('/outbound', warehouseStockValidateController.createOutbound);

export default router;
