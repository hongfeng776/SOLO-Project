import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware';
import { promoterLevelController } from '../controllers';

const router = Router();

router.use(authMiddleware);

router.get('/rules', promoterLevelController.getAllRules);
router.put('/rules', promoterLevelController.saveLevelRule);
router.post('/validate/:level', promoterLevelController.validateThresholds);
router.post('/batch-reevaluate', promoterLevelController.batchReEvaluate);
router.post('/adjust-request', promoterLevelController.requestManualAdjust);
router.put('/adjust-request/:id/review', promoterLevelController.reviewAdjust);
router.get('/adjust-requests', promoterLevelController.getAdjustRequests);
router.post('/batch-reset', promoterLevelController.batchResetLevels);
router.get('/:promoterId/change-logs', promoterLevelController.getChangeLogs);
router.get('/iteration/statistics', promoterLevelController.getIterationStats);

export default router;
