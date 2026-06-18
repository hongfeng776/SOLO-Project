import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware';
import { promoterRiskController } from '../controllers';

const router = Router();

router.use(authMiddleware);

router.get('/records', promoterRiskController.getRiskList);
router.get('/records/:id', promoterRiskController.getRiskDetail);
router.get('/profile/:promoterId', promoterRiskController.getRiskProfile);
router.get('/analysis/:promoterId', promoterRiskController.getRiskAnalysis);
router.post('/mark', promoterRiskController.markRisk);
router.put('/records/:id/cancel', promoterRiskController.cancelRisk);
router.get('/releases', promoterRiskController.getReleaseList);
router.post('/release', promoterRiskController.submitRelease);
router.put('/releases/:id/review', promoterRiskController.reviewRelease);
router.post('/batch/mark', promoterRiskController.batchMarkRisk);
router.post('/batch/cancel', promoterRiskController.batchCancelRisk);
router.get('/trace/:promoterId', promoterRiskController.getBehaviorTrace);
router.get('/warnings', promoterRiskController.getWarningList);
router.put('/warnings/:id/handle', promoterRiskController.handleWarning);
router.get('/statistics', promoterRiskController.getStatistics);

export default router;
