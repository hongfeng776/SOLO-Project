import { Router } from 'express';
import { distributionOrderController } from '../controllers';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/validate', distributionOrderController.validateParams);
router.get('/', distributionOrderController.findAll);
router.get('/statistics', distributionOrderController.getStatistics);
router.get('/export/permission', distributionOrderController.checkExportPermission);
router.get('/export', distributionOrderController.export);
router.get('/query-logs', distributionOrderController.getQueryLogs);
router.post('/batch-mark', distributionOrderController.bulkMark);
router.post('/batch-statistics', distributionOrderController.getBatchStatistics);

export default router;
