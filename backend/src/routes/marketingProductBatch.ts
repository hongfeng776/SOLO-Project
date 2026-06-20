import { Router } from 'express';
import marketingProductBatchController from '../controllers/MarketingProductBatchController';

const router = Router();

router.post('/audit-pass', marketingProductBatchController.batchAuditPass);
router.post('/audit-reject', marketingProductBatchController.batchAuditReject);
router.post('/offline', marketingProductBatchController.batchOffline);
router.post('/online', marketingProductBatchController.batchOnline);
router.post('/remove', marketingProductBatchController.batchRemove);
router.post('/filter-operate', marketingProductBatchController.filterAndOperate);
router.post('/import-apply', marketingProductBatchController.batchImportApply);
router.post('/add-compliant', marketingProductBatchController.batchAddCompliantGoods);

export default router;
