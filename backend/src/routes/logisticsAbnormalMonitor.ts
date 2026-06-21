import { Router } from 'express';
import logisticsAbnormalMonitorController from '../controllers/LogisticsAbnormalMonitorController';

const router = Router();

router.post('/detect', logisticsAbnormalMonitorController.runAbnormalDetection);
router.post('/process', logisticsAbnormalMonitorController.processAbnormal);
router.post('/batch-detect', logisticsAbnormalMonitorController.batchDetectAbnormal);
router.get('/rules', logisticsAbnormalMonitorController.getDetectionRules);
router.post('/rules', logisticsAbnormalMonitorController.createDetectionRule);
router.put('/rules/:id', logisticsAbnormalMonitorController.updateDetectionRule);
router.delete('/rules/:id', logisticsAbnormalMonitorController.deleteDetectionRule);

export default router;
